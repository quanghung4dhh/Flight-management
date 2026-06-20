import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, tickets, flights, seats } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const bookingRouter = createRouter({
  create: authedQuery
    .input(
      z
        .object({
          flightId: z.string(),
          seatIds: z.array(z.string()),
          passengerDetails: z.array(
            z.object({
              name: z.string(),
              passport: z.string().optional(),
            })
          ),
          totalAmount: z.number(),
        })
        .refine(data => data.passengerDetails.length === data.seatIds.length, {
          message: "Number of passengers must match number of seats",
          path: ["seatIds"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const customerID = ctx.user?.accountID;

      return await db.transaction(async tx => {
        const bookingID = crypto.randomUUID().slice(0, 10);

        await tx.insert(bookings).values({
          bookingID,
          customerID,
          bookDate: new Date(),
          totalAmount: String(input.totalAmount),
          status: "pending",
        });

        for (let i = 0; i < input.passengerDetails.length; i++) {
          await tx.insert(tickets).values({
            ticketID: crypto.randomUUID().slice(0, 10),
            bookingID,
            flightID: input.flightId,
            seatID: input.seatIds[i],
            status: "active",
            passengerName: input.passengerDetails[i].name,
            passengerPassport: input.passengerDetails[i].passport || null,
            purchasedPrice: String(
              input.totalAmount / input.passengerDetails.length
            ),
          });
        }

        return { bookingID };
      });
    }),

  myBookings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.customerID, ctx.user?.accountID || ""))
      .orderBy(desc(bookings.createdAt));
  }),

  byId: authedQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.bookingID, input.id),
            eq(bookings.customerID, ctx.user?.accountID || "")
          )
        )
        .limit(1);
      return result[0] || null;
    }),

  cancel: authedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const bookingResult = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.bookingID, input.id),
            eq(bookings.customerID, ctx.user?.accountID || "")
          )
        )
        .limit(1);

      if (bookingResult.length === 0) throw new Error("Booking not found");
      const booking = bookingResult[0];

      if (booking.status === "cancelled") throw new Error("Already cancelled");

      await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.bookingID, input.id));

      await db
        .update(tickets)
        .set({ status: "cancelled" })
        .where(eq(tickets.bookingID, input.id));

      return { success: true };
    }),
});
