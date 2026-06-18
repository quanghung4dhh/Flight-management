import { findAccountByUsername, findAccountById, createAccount } from "./accounts.js";

export const findUserByEmail = findAccountByUsername;
export const findUserById = findAccountById;
export const findUserByUnionId = async (unionId: string) => {
  // Nếu cần tìm theo unionId, sửa logic phù hợp
  return findAccountByUsername(unionId);
};
export const upsertUser = async (data: any) => {
  return createAccount({
    username: data.email || data.unionId || nanoid(8),
    password: data.passwordHash || await bcrypt.hash(nanoid(8), 10),
    role: "customer",
    status: "active",
  });
};
