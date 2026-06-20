import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  flights,
  routes,
  airports,
  aircraft,
  flightPricing,
  seats,
  seatClass,
  tickets,
} from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const flightRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        departureAirportId: z.string(), // ← Đổi sang string
        arrivalAirportId: z.string(), // ← Đổi sang string
        departureDate: z.string(),
        seatClass: z
          .enum(["ECO", "BUS", "FST"]) // ← Đổi theo schema mới
          .optional()
          .default("ECO"),
        passengers: z.number().min(1).max(9).optional().default(1),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const startOfDay = new Date(input.departureDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.departureDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find route
      const routeResult = await db
        .select()
        .from(routes)
        .where(
          and(
            eq(routes.departureAirportID, input.departureAirportId),
            eq(routes.arrivalAirportID, input.arrivalAirportId)
          )
        )
        .limit(1);

      if (routeResult.length === 0) {
        return { flights: [], route: null };
      }

      const route = routeResult[0];

      // Find flights
      const flightList = await db
        .select()
        .from(flights)
        .where(
          and(
            eq(flights.routeID, route.routeID),
            gte(flights.scheduledDeparture, startOfDay),
            lte(flights.scheduledDeparture, endOfDay),
            eq(flights.status, "scheduled")
          )
        )
        .orderBy(flights.scheduledDeparture);

      // Get pricing for each flight
      const flightsWithPricing = await Promise.all(
        flightList.map(async flight => {
          const pricing = await db
            .select()
            .from(flightPricing)
            .where(
              and(
                eq(flightPricing.flightID, flight.flightID),
                eq(flightPricing.seatClassID, input.seatClass)
              )
            )
            .limit(1);

          return {
            ...flight,
            basePrice: pricing[0]?.basePrice || "0",
          };
        })
      );

      return { flights: flightsWithPricing, route };
    }),

  byId: publicQuery
    .input(z.object({ id: z.string() })) // ← Đổi sang string
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(flights)
        .where(eq(flights.flightID, input.id))
        .limit(1);
      return result[0] || null;
    }),
  seats: publicQuery
    .input(z.object({ flightId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const flight = await db
        .select()
        .from(flights)
        .where(eq(flights.flightID, input.flightId))
        .limit(1);

      if (!flight[0]) throw new Error("Flight not found");

      const seatList = await db
        .select({
          seatID: seats.seatID,
          seatNumber: seats.seatNumber,
          seatClassID: seats.seatClassID,
          seatClassName: seatClass.name,
        })
        .from(seats)
        .innerJoin(seatClass, eq(seats.seatClassID, seatClass.seatClassID))
        .where(eq(seats.aircraftID, flight[0].aircraftID));

      const bookedSeats = await db
        .select({ seatID: tickets.seatID })
        .from(tickets)
        .where(eq(tickets.flightID, input.flightId));

      const bookedSeatIds = new Set(bookedSeats.map(s => s.seatID));

      return seatList.map(s => ({
        ...s,
        isAvailable: !bookedSeatIds.has(s.seatID),
      }));
    }),
});
