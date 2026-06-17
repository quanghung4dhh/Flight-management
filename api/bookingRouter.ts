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

function generateTicketNumber(): string {
  const prefix = "784";
  const digits = Math.floor(Math.random() * 900000000 + 100000000);
  return `${prefix}${digits}`;
}

export const bookingRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        flightId: z.number(),
        tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
        returnFlightId: z.number().optional(),
        seatIds: z.array(z.number()),
        passengerDetails: z.array(
          z.object({
            name: z.string(),
            type: z.enum(["adult", "child", "infant"]).default("adult"),
          })
        ),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        totalAmount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check seat availability
      const seatStatuses = await db.query.flightSeats.findMany({
        where: and(
          eq(flightSeats.flightId, input.flightId),
          eq(flightSeats.status, "available")
        ),
      });

      const availableSeatIds = new Set(seatStatuses.map((s) => s.seatId));
      const requestedSeatIds = new Set(input.seatIds);

      for (const seatId of requestedSeatIds) {
        if (!availableSeatIds.has(seatId)) {
          throw new Error(`Seat ${seatId} is no longer available`);
        }
      }

      // Create booking
      const bookingCode = generateBookingCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const [{ id: bookingId }] = await db
        .insert(bookings)
        .values({
          bookingCode,
          userId,
          flightId: input.flightId,
          tripType: input.tripType,
          returnFlightId: input.returnFlightId || null,
          status: "pending",
          totalAmount: String(input.totalAmount),
          paymentStatus: "pending",
          passengerDetails: input.passengerDetails,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone || null,
          expiresAt,
        })
        .$returningId();

      // Block seats
      for (const seatId of input.seatIds) {
        await db
          .update(flightSeats)
          .set({ status: "blocked", bookedBy: userId, bookingId })
          .where(
            and(
              eq(flightSeats.flightId, input.flightId),
              eq(flightSeats.seatId, seatId)
            )
          );
      }

      // Create tickets
      for (let i = 0; i < input.passengerDetails.length; i++) {
        const passenger = input.passengerDetails[i];
        await db.insert(tickets).values({
          bookingId,
          ticketNumber: generateTicketNumber(),
          passengerName: passenger.name,
          passengerType: passenger.type,
          seatId: input.seatIds[i] || null,
          status: "active",
        });
      }

      return { bookingId, bookingCode };
    }),

  myBookings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.bookings.findMany({
      where: eq(bookings.userId, ctx.user.id),
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
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)),
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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)),
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.status === "cancelled") throw new Error("Already cancelled");

      // Release seats
      await db
        .update(flightSeats)
        .set({ status: "available", bookedBy: null, bookingId: null })
        .where(eq(flightSeats.bookingId, input.id));

      // Cancel booking
      await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.id));

      // Cancel tickets
      await db
        .update(tickets)
        .set({ status: "cancelled" })
        .where(eq(tickets.bookingId, input.id));

      return { success: true };
    }),
});
