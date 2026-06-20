import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Account } from "@db/schema";
import * as cookie from "cookie";
import { verifySessionToken } from "./auth/session";
import { findAccountById } from "./queries/accounts.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: Account;
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const cookieHeader = opts.req.headers.get("cookie") || "";

    const cookies = cookie.parse(cookieHeader);

    const token = cookies["kimi_sid"];
    if (!token) {
      return ctx;
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return ctx;
    }

    const user = await findAccountById(payload.userId as string);
    if (user) ctx.user = user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }
  return ctx;
}
