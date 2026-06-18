import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, tickets, flightSeats } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueBookingCode(db: any): Promise<string> {
  let code = generateBookingCode();
  let exists = true;
  while (exists) {
    const result = await db.query.bookings.findFirst({
      where: eq(bookings.bookingCode, code),
    });
    if (!result) exists = false;
    else code = generateBookingCode();
  }
  return code;
}

function generateTicketNumber(): string {
  const prefix = "784";
  const digits = Math.floor(Math.random() * 900000000 + 100000000);
  return `${prefix}${digits}`;
}

async function getUniqueTicketNumber(db: any): Promise<string> {
  let number = generateTicketNumber();
  let exists = true;
  while (exists) {
    const result = await db.query.tickets.findFirst({
      where: eq(tickets.ticketNumber, number),
    });
    if (!result) exists = false;
    else number = generateTicketNumber();
  }
  return number;
}

export const bookingRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        flightId: z.string(),
        tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
        returnFlightId: z.string().optional(),
        seatIds: z.array(z.string()),
        passengerDetails: z.array(
          z.object({
            name: z.string(),
            type: z.enum(["adult", "child", "infant"]).default("adult"),
          })
        ),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        totalAmount: z.number(),
      }).refine(data => data.passengerDetails.length === data.seatIds.length, {
        message: "Number of passengers must match number of seats",
        path: ["seatIds"],
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      return await db.transaction(async (tx) => {
        // Generate IDs
        const bookingId = crypto.randomUUID();
        const bookingCode = await getUniqueBookingCode(tx);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // 1. Block seats atomically
        for (const seatId of input.seatIds) {
          const result = await tx
            .update(flightSeats)
            .set({ status: "blocked", bookedBy: userId, bookingID: bookingId })
            .where(
              and(
                eq(flightSeats.flightID, input.flightId),
                eq(flightSeats.seatID, seatId),
                eq(flightSeats.status, "available")
              )
            );

          if (result.rowCount === 0) {
            throw new Error(`Seat ${seatId} is no longer available`);
          }
        }

        // 2. Create booking
        await tx.insert(bookings).values({
          bookingID: bookingId,
          customerID: userId,
          bookingCode,
          flightID: input.flightId,
          tripType: input.tripType,
          returnFlightID: input.returnFlightId || null,
          totalAmount: String(input.totalAmount),
          status: "pending",
          paymentStatus: "pending",
          passengerDetails: JSON.stringify(input.passengerDetails),
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone || null,
          bookDate: new Date(),
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // 3. Create tickets
        for (let i = 0; i < input.passengerDetails.length; i++) {
          const passenger = input.passengerDetails[i];
          const ticketNumber = await getUniqueTicketNumber(tx);
          await tx.insert(tickets).values({
            ticketID: crypto.randomUUID(),
            bookingID: bookingId,
            flightID: input.flightId,
            seatID: input.seatIds[i],
            ticketNumber,
            passengerName: passenger.name,
            passengerType: passenger.type,
            status: "active",
            purchasedPrice: String(input.totalAmount / input.passengerDetails.length),
          });
        }

        return { bookingId, bookingCode };
      });
    }),

  myBookings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.bookings.findMany({
      where: eq(bookings.customerID, ctx.user.id),
      with: {
        flight: {
          with: {
            route: {
              with: {
                departureAirport: true,
                arrivalAirport: true,
              },
            },
          },
        },
        tickets: true,
      },
      orderBy: desc(bookings.createdAt),
    });
  }),

  byId: authedQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.bookings.findFirst({
        where: and(eq(bookings.bookingID, input.id), eq(bookings.customerID, ctx.user.id)),
        with: {
          flight: {
            with: {
              route: {
                with: {
                  departureAirport: true,
                  arrivalAirport: true,
                },
              },
              aircraft: true,
            },
          },
          returnFlight: {
            with: {
              route: {
                with: {
                  departureAirport: true,
                  arrivalAirport: true,
                },
              },
            },
          },
          tickets: {
            with: {
              seat: true,
            },
          },
          payments: true,
        },
      });
    }),

  cancel: authedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.bookingID, input.id), eq(bookings.customerID, ctx.user.id)),
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.status === "cancelled") throw new Error("Already cancelled");

      // Release seats
      await db
        .update(flightSeats)
        .set({ status: "available", bookedBy: null, bookingID: null })
        .where(eq(flightSeats.bookingID, input.id));

      // Cancel booking
      await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.bookingID, input.id));

      // Cancel tickets
      await db
        .update(tickets)
        .set({ status: "cancelled" })
        .where(eq(tickets.bookingID, input.id));

      return { success: true };
    }),
});
