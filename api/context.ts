import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Account } from "@db/schema";
import * as cookie from "cookie";
import { verifySessionToken } from "./auth/session";
import { findAccountById } from "./queries/accounts.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: Account;  // ← Đổi từ User sang Account
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
    const token = cookies["session"];
    if (!token) return ctx;

    const payload = await verifySessionToken(token);
    if (!payload) return ctx;

    // ← Đổi từ parseInt(payload.userId) sang payload.accountID (string)
    const user = await findAccountById(payload.accountID as string);
    if (user) ctx.user = user;
  } catch {
    // Authentication is optional
  }
  return ctx;
}