import { getDb } from "./connection";
import { accounts } from "@db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function findAccountByUsername(username: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(accounts)
    .where(eq(accounts.username, username))
    .limit(1);
  
  return result[0] || null;
}

export async function createAccount(data: {
  username: string;
  password: string;
  role: string;
  status: string;
}) {
  const db = getDb();
  const accountID = nanoid(10);
  
  await db.insert(accounts).values({
    accountID,
    username: data.username,
    password: data.password,
    role: data.role,
    status: data.status,
  });
  
  return findAccountByUsername(data.username);
}

export async function findAccountById(accountID: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(accounts)
    .where(eq(accounts.accountID, accountID))
    .limit(1);
  
  return result[0] || null;
}
