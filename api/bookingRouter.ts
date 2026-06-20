import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, tickets, flights, routes, airports } from "@db/schema";
import { eq, and, desc, count } from "drizzle-orm";

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

    // Lấy danh sách booking của user
    const bookingList = await db
      .select()
      .from(bookings)
      .where(eq(bookings.customerID, ctx.user?.accountID || ""))
      .orderBy(desc(bookings.createdAt));

    // Bổ sung thông tin chuyến bay và số khách
    const enriched = await Promise.all(
      bookingList.map(async (booking) => {
        // Đếm số vé
        const ticketCountResult = await db
          .select({ count: count() })
          .from(tickets)
          .where(eq(tickets.bookingID, booking.bookingID));

        const passengerCount = ticketCountResult[0]?.count ?? 0;

        // Lấy ticket đầu tiên để biết flight
        const ticketList = await db
          .select()
          .from(tickets)
          .where(eq(tickets.bookingID, booking.bookingID))
          .limit(1);

        if (ticketList.length === 0) {
          return { ...booking, passengerCount, flight: null };
        }

        // Lấy thông tin chuyến bay + route
        const flightInfo = await db
          .select()
          .from(flights)
          .innerJoin(routes, eq(flights.routeID, routes.routeID))
          .where(eq(flights.flightID, ticketList[0].flightID))
          .limit(1);

        if (flightInfo.length === 0) {
          return { ...booking, passengerCount, flight: null };
        }

        const flight = flightInfo[0].Flight;
        const route = flightInfo[0].Route;

        // Lấy sân bay đi và đến riêng biệt (không cần alias)
        const [depAirport] = await db
          .select()
          .from(airports)
          .where(eq(airports.airportID, route.departureAirportID))
          .limit(1);

        const [arrAirport] = await db
          .select()
          .from(airports)
          .where(eq(airports.airportID, route.arrivalAirportID))
          .limit(1);

        return {
          ...booking,
          passengerCount,
          flight: {
            flightID: flight.flightID,
            scheduledDeparture: flight.scheduledDeparture,
            scheduledArrival: flight.scheduledArrival,
            status: flight.status,
            departureAirport: depAirport
              ? {
                  airportID: depAirport.airportID,
                  iataCode: depAirport.iataCode,
                  city: depAirport.city,
                }
              : null,
            arrivalAirport: arrAirport
              ? {
                  airportID: arrAirport.airportID,
                  iataCode: arrAirport.iataCode,
                  city: arrAirport.city,
                }
              : null,
          },
        };
      })
    );

    return enriched;
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