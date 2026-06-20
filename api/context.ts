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
    console.log("DEBUG cookie header:", cookieHeader);
    
    const cookies = cookie.parse(cookieHeader);
    console.log("DEBUG parsed cookies:", cookies);
    
    const token = cookies["kimi_sid"];
    console.log("DEBUG token:", token ? "EXISTS" : "MISSING");
    if (!token) {
      console.log("DEBUG: No token, returning empty context");
      return ctx;
    }

    const payload = await verifySessionToken(token);
    console.log("DEBUG payload:", payload);
    if (!payload) {
      console.log("DEBUG: Invalid token, returning empty context");
      return ctx;
    }

    console.log("DEBUG userId from payload:", payload.userId);
    const user = await findAccountById(payload.userId as string);
    console.log("DEBUG user found:", user ? "YES" : "NO", user);
    if (user) ctx.user = user;
  } catch (e) {
    console.error("DEBUG context error:", e);
  }
  return ctx;
}
