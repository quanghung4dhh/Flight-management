import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { flights, routes, seats, flightSeats } from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const flightRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        departureAirportId: z.number(),
        arrivalAirportId: z.number(),
        departureDate: z.string(), // ISO date string
        seatClass: z
          .enum(["economy", "premium", "business"])
          .optional()
          .default("economy"),
        passengers: z.number().min(1).max(9).optional().default(1),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const startOfDay = new Date(input.departureDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.departureDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find the route first
      const route = await db.query.routes.findFirst({
        where: and(
          eq(routes.departureAirportId, input.departureAirportId),
          eq(routes.arrivalAirportId, input.arrivalAirportId),
          eq(routes.status, "active")
        ),
      });

      if (!route) {
        return { flights: [], route: null };
      }

      // Find flights for this route on the given date
      const flightList = await db.query.flights.findMany({
        where: and(
          eq(flights.routeId, route.id),
          gte(flights.scheduledDeparture, startOfDay),
          lte(flights.scheduledDeparture, endOfDay),
          eq(flights.status, "scheduled")
        ),
        with: {
          route: {
            with: {
              departureAirport: true,
              arrivalAirport: true,
            },
          },
          aircraft: true,
        },
        orderBy: flights.scheduledDeparture,
      });

      // Get available seat count for each flight
      const flightsWithAvailability = await Promise.all(
        flightList.map(async flight => {
          const availableSeats = await db.query.flightSeats.findMany({
            where: and(
              eq(flightSeats.flightId, flight.id),
              eq(flightSeats.status, "available")
            ),
            with: {
              seat: true,
            },
          });

          const classSeats = availableSeats.filter(
            fs => fs.seat?.seatClass === input.seatClass
          );

          return {
            ...flight,
            availableSeats: classSeats.length,
            price:
              input.seatClass === "business"
                ? flight.businessPrice
                : input.seatClass === "premium"
                  ? flight.premiumPrice
                  : flight.economyPrice,
          };
        })
      );

      return { flights: flightsWithAvailability, route };
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.flights.findFirst({
        where: eq(flights.id, input.id),
        with: {
          route: {
            with: {
              departureAirport: true,
              arrivalAirport: true,
            },
          },
          aircraft: true,
        },
      });
    }),

  seatMap: publicQuery
    .input(z.object({ flightId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const seatList = await db.query.flightSeats.findMany({
        where: eq(flightSeats.flightId, input.flightId),
        with: {
          seat: true,
        },
        orderBy: [seats.seatMapRow, seats.seatMapCol],
      });

      return seatList;
    }),
});
