import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./auth/session";
import { findAccountByUsername, createAccount } from "./queries/accounts";
import { getDb } from "./queries/connection";
import { customers } from "@db/schema";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

export const authRouter = createRouter({
  me: authedQuery.query(opts => opts.ctx.user),

  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password } = input;

      const account = await findAccountByUsername(username);
      if (!account || !account.password) {
        throw new Error("Invalid username or password");
      }

      const validPassword = await bcrypt.compare(password, account.password);
      if (!validPassword) {
        throw new Error("Invalid username or password");
      }

      const token = await signSessionToken({
        userId: account.accountID,
      });
      const opts = getSessionCookieOptions(ctx.req.headers);

      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return {
        success: true,
        user: {
          accountID: account.accountID,
          username: account.username,
          role: account.role,
        },
      };
    }),

  signup: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password, name } = input;

      const existing = await findAccountByUsername(username);
      if (existing) {
        throw new Error("Username already registered");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const account = await createAccount({
        username,
        password: passwordHash,
        role: "customer",
        status: "active",
      });

      if (!account) throw new Error("Failed to create account");

      // Create Customers record linked to account
      const db = getDb();
      await db.insert(customers).values({
        customerID: account.accountID,
        accountID: account.accountID,
        name: name,
        email: "",
        phone: "",
        passport: null,
        address: null,
        birthday: null,
      });

      const token = await signSessionToken({
        userId: account.accountID,
      });
      const opts = getSessionCookieOptions(ctx.req.headers);

      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return {
        success: true,
        user: {
          accountID: account.accountID,
          username: account.username,
          role: account.role,
        },
      };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );
    return { success: true };
  }),
});
