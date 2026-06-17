import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import * as cookie from "cookie";
import { verifySessionToken } from "./auth/session";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
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

    const user = await findUserById(parseInt(payload.userId));
    if (user) ctx.user = user;
  } catch {
    // Authentication is optional
  }
  return ctx;
}
