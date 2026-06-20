import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  flights,
  airports,
  aircraft,
  bookings,
  accounts,
  customers,
  crew,
  maintenance,
  payments,
  tickets,
  routes
} from "@db/schema";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";

export const adminRouter = createRouter({
  // Dashboard stats
  stats: adminQuery.query(async () => {
    const db = getDb();

    const totalFlights = await db.select({ count: count() }).from(flights);
    const totalBookings = await db.select({ count: count() }).from(bookings);
    const totalUsers = await db.select({ count: count() }).from(accounts);

    // Revenue from bookings via successful payments
    const totalRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingID, bookings.bookingID))
      .where(eq(payments.status, "paid"));

    const recentBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    return {
      totalFlights: totalFlights[0]?.count ?? 0,
      totalBookings: totalBookings[0]?.count ?? 0,
      totalUsers: totalUsers[0]?.count ?? 0,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      recentBookings,
    };
  }),

  // Revenue report
  revenueReport: adminQuery
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [eq(payments.status, "paid")];
      if (input.startDate) {
        conditions.push(gte(payments.payDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(payments.payDate, new Date(input.endDate)));
      }

      const revenue = await db
        .select({
          date: sql<string>`DATE(${payments.payDate})`,
          total: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
          count: count(),
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingID, bookings.bookingID))
        .where(and(...conditions))
        .groupBy(sql`DATE(${payments.payDate})`)
        .orderBy(sql`DATE(${payments.payDate})`);

      return revenue;
    }),

  // Flight management
  flightList: adminQuery
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const where = input.status
        ? eq(flights.status, input.status as any)
        : undefined;

      const flightList = await db
        .select()
        .from(flights)
        .where(where)
        .orderBy(desc(flights.scheduledDeparture))
        .limit(input.limit)
        .offset(offset);

      return flightList;
    }),

  flightCreate: adminQuery
    .input(
      z.object({
        routeID: z.string(),
        aircraftID: z.string(),
        scheduledDeparture: z.string(),
        scheduledArrival: z.string(),
        status: z
          .enum([
            "scheduled",
            "boarding",
            "departed",
            "arrived",
            "delayed",
            "cancelled",
          ])
          .default("scheduled"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const flightID = crypto.randomUUID().slice(0, 10);

      await db.insert(flights).values({
        flightID,
        routeID: input.routeID,
        aircraftID: input.aircraftID,
        scheduledDeparture: new Date(input.scheduledDeparture),
        scheduledArrival: new Date(input.scheduledArrival),
        status: input.status,
      });

      return { id: flightID };
    }),

  flightUpdate: adminQuery
    .input(
      z.object({
        flightID: z.string(),
        scheduledDeparture: z.string().optional(),
        scheduledArrival: z.string().optional(),
        status: z
          .enum([
            "scheduled",
            "boarding",
            "departed",
            "arrived",
            "delayed",
            "cancelled",
          ])
          .optional(),
        actualDeparture: z.string().optional(),
        actualArrival: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { flightID, ...data } = input;

      const updateData: any = {};
      if (data.scheduledDeparture)
        updateData.scheduledDeparture = new Date(data.scheduledDeparture);
      if (data.scheduledArrival)
        updateData.scheduledArrival = new Date(data.scheduledArrival);
      if (data.status) updateData.status = data.status;
      if (data.actualDeparture)
        updateData.actualDeparture = new Date(data.actualDeparture);
      if (data.actualArrival)
        updateData.actualArrival = new Date(data.actualArrival);

      await db
        .update(flights)
        .set(updateData)
        .where(eq(flights.flightID, flightID));
      return { success: true };
    }),

  // Airport management
  airportList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(airports).orderBy(airports.iataCode);
  }),

  airportCreate: adminQuery
    .input(
      z.object({
        airportID: z.string(),
        iataCode: z.string(),
        city: z.string(),
        country: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(airports).values(input);
      return { id: input.airportID };
    }),

  // Aircraft management
  aircraftList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(aircraft).orderBy(aircraft.model);
  }),

  aircraftCreate: adminQuery
    .input(
      z.object({
        aircraftID: z.string(),
        model: z.string(),
        manufacturer: z.string(),
        capacity: z.number(),
        status: z.enum(["active", "maintenance", "retired"]).default("active"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(aircraft).values(input);
      return { id: input.aircraftID };
    }),

  // Booking management
  bookingList: adminQuery
  .input(
    z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    })
  )
  .query(async ({ input }) => {
    const db = getDb();
    const offset = (input.page - 1) * input.limit;

    const where = input.status
      ? eq(bookings.status, input.status as any)
      : undefined;

    // Lấy danh sách booking
    const bookingList = await db
      .select()
      .from(bookings)
      .where(where)
      .orderBy(desc(bookings.createdAt))
      .limit(input.limit)
      .offset(offset);

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

        // Lấy sân bay đi và đến
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

  // Customer management
  customerList: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      return db
        .select()
        .from(customers)
        .orderBy(desc(customers.customerID))
        .limit(input.limit)
        .offset(offset);
    }),

  // Maintenance logs
  maintenanceList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(maintenance).orderBy(desc(maintenance.startDate));
  }),

  // Crew management
  crewList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(crew).orderBy(crew.crewID);
  }),
});
