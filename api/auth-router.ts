import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./auth/session";
import { findUserByEmail, upsertUser } from "./queries/users";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

export const authRouter = createRouter({
  me: authedQuery.query(opts => opts.ctx.user),

  login: publicQuery
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const user = await findUserByEmail(email);
      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password");
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw new Error("Invalid email or password");
      }

      const token = await signSessionToken({ userId: user.id.toString() });
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

      return { success: true, user };
    }),

  signup: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password, name } = input;

      const existing = await findUserByEmail(email);
      if (existing) {
        throw new Error("Email already registered");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await upsertUser({
        email,
        name,
        passwordHash,
      });

      if (!user) throw new Error("Failed to create user");

      const token = await signSessionToken({ userId: user.id.toString() });
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

      return { success: true, user };
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
