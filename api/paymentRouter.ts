import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, bookings } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const paymentRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        bookingId: z.number(),
        amount: z.number(),
        method: z.enum([
          "credit_card",
          "debit_card",
          "momo",
          "zalopay",
          "qr_code",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify booking belongs to user
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, input.bookingId),
          eq(bookings.userId, ctx.user.id)
        ),
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.paymentStatus === "paid") throw new Error("Already paid");

      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const [{ id: paymentId }] = await db
        .insert(payments)
        .values({
          bookingId: input.bookingId,
          amount: String(input.amount),
          method: input.method,
          status: "pending",
          transactionId,
          paymentDetails: {
            cardLast4:
              input.method === "credit_card" || input.method === "debit_card"
                ? "4242"
                : null,
            methodName: input.method,
          },
        })
        .$returningId();

      return { paymentId, transactionId, status: "pending" };
    }),

  confirm: authedQuery
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, input.paymentId),
        with: {
          booking: true,
        },
      });

      if (!payment) throw new Error("Payment not found");
      if (payment.booking?.userId !== ctx.user.id)
        throw new Error("Unauthorized");

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update payment status
      await db
        .update(payments)
        .set({
          status: "success",
          paidAt: new Date(),
        })
        .where(eq(payments.id, input.paymentId));

      // Update booking status
      await db
        .update(bookings)
        .set({
          status: "confirmed",
          paymentStatus: "paid",
        })
        .where(eq(bookings.id, payment.bookingId));

      return { success: true, status: "success" };
    }),

  myPayments: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.payments.findMany({
      where: eq(payments.id, ctx.user.id),
      with: {
        booking: {
          with: {
            flight: true,
          },
        },
      },
      orderBy: desc(payments.createdAt),
    });
  }),
});
