import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, bookings } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const paymentRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        bookingId: z.string(),
        amount: z.number(),
        method: z.enum(["credit_card", "bank_transfer", "momo"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const bookingResult = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.bookingID, input.bookingId),
            eq(bookings.customerID, ctx.user?.accountID || "")
          )
        )
        .limit(1);

      if (bookingResult.length === 0) throw new Error("Booking not found");

      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await db.insert(payments).values({
        paymentID: crypto.randomUUID().slice(0, 10),
        transactionID: transactionId,
        bookingID: input.bookingId,
        payDate: new Date(),
        method: input.method,
        status: "pending",
      });

      return { transactionId, status: "pending" };
    }),

  confirm: authedQuery
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const paymentResult = await db
        .select()
        .from(payments)
        .where(eq(payments.paymentID, input.paymentId))
        .limit(1);

      if (paymentResult.length === 0) throw new Error("Payment not found");
      const payment = paymentResult[0];

      await db
        .update(payments)
        .set({ status: "paid" })
        .where(eq(payments.paymentID, input.paymentId));

      await db
        .update(bookings)
        .set({ status: "confirmed" })
        .where(eq(bookings.bookingID, payment.bookingID));

      return { success: true, status: "paid" };
    }),

  myPayments: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingID, bookings.bookingID))
      .where(eq(bookings.customerID, ctx.user?.accountID || ""))
      .orderBy(desc(payments.createdAt));
  }),
});