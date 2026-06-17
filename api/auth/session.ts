import * as jose from "jose";
import { env } from "../lib/env";

export type SessionPayload = {
  userId: string;
};

const JWT_ALG = "HS256";

export async function signSessionToken(
  payload: SessionPayload
): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const userId = payload.userId as string;
    if (!userId) {
      return null;
    }
    return { userId } as SessionPayload;
  } catch {
    return null;
  }
}
