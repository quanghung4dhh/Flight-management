import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { accounts, customers, notifications } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const userRouter = createRouter({
  profile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountID, ctx.user.accountID))
      .limit(1);

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.accountID, ctx.user.accountID))
      .limit(1);

    return {
      ...account[0],
      customer: customer[0] || null,
    };
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        passport: z.string().optional(),
        address: z.string().optional(),
        birthday: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const accountID = ctx.user.accountID;

      const existingCustomer = await db
        .select()
        .from(customers)
        .where(eq(customers.accountID, accountID))
        .limit(1);

      if (existingCustomer.length > 0) {
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.phone) updateData.phone = input.phone;
        if (input.email) updateData.email = input.email;
        if (input.passport) updateData.passport = input.passport;
        if (input.address) updateData.address = input.address;
        if (input.birthday) updateData.birthday = new Date(input.birthday);

        await db
          .update(customers)
          .set(updateData)
          .where(eq(customers.accountID, accountID));
      } else {
        await db.insert(customers).values({
          customerID: crypto.randomUUID().slice(0, 10),
          accountID,
          name: input.name || ctx.user.username,
          email: input.email || "",
          phone: input.phone || null,
          passport: input.passport || null,
          address: input.address || null,
          birthday: input.birthday ? new Date(input.birthday) : null,
        });
      }

      return { success: true };
    }),

  notifications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.accountID, ctx.user.accountID))
      .orderBy(desc(notifications.sentAt))
      .limit(50);
  }),

  markNotificationRead: authedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ status: "read" })
        .where(
          and(
            eq(notifications.notificationID, input.id),
            eq(notifications.accountID, ctx.user.accountID)
          )
        );
      return { success: true };
    }),
});
