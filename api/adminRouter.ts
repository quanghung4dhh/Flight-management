import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  flights,
  airports,
  aircraft,
  bookings,
  users,
  crewMembers,
  maintenanceLogs,
  payments,
} from "@db/schema";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";

export const adminRouter = createRouter({
  // Dashboard stats
  stats: adminQuery.query(async () => {
    const db = getDb();

    const totalFlights = await db.select({ count: count() }).from(flights);
    const totalBookings = await db.select({ count: count() }).from(bookings);
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, "success"));

    const recentBookings = await db.query.bookings.findMany({
      with: {
        user: true,
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
      },
      orderBy: desc(bookings.createdAt),
      limit: 10,
    });

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

      const conditions = [eq(payments.status, "success")];
      if (input.startDate) {
        conditions.push(gte(payments.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(payments.createdAt, new Date(input.endDate)));
      }

      const revenue = await db
        .select({
          date: sql<string>`DATE(${payments.createdAt})`,
          total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
          count: count(),
        })
        .from(payments)
        .where(and(...conditions))
        .groupBy(sql`DATE(${payments.createdAt})`)
        .orderBy(sql`DATE(${payments.createdAt})`);

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

      const flightList = await db.query.flights.findMany({
        where,
        with: {
          route: {
            with: {
              departureAirport: true,
              arrivalAirport: true,
            },
          },
          aircraft: true,
        },
        orderBy: desc(flights.scheduledDeparture),
        limit: input.limit,
        offset,
      });

      return flightList;
    }),

  flightCreate: adminQuery
    .input(
      z.object({
        flightNumber: z.string(),
        routeId: z.number(),
        aircraftId: z.number(),
        scheduledDeparture: z.string(),
        scheduledArrival: z.string(),
        basePrice: z.number(),
        economyPrice: z.number(),
        premiumPrice: z.number().optional(),
        businessPrice: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [{ id }] = await db
        .insert(flights)
        .values({
          ...input,
          scheduledDeparture: new Date(input.scheduledDeparture),
          scheduledArrival: new Date(input.scheduledArrival),
          basePrice: String(input.basePrice),
          economyPrice: String(input.economyPrice),
          premiumPrice: String(input.premiumPrice || input.economyPrice * 1.5),
          businessPrice: String(input.businessPrice || input.economyPrice * 2.5),
          status: "scheduled",
          createdBy: ctx.user.id,
        })
        .$returningId();

      return { id };
    }),

  flightUpdate: adminQuery
    .input(
      z.object({
        id: z.number(),
        flightNumber: z.string().optional(),
        scheduledDeparture: z.string().optional(),
        scheduledArrival: z.string().optional(),
        status: z.enum(["scheduled", "boarding", "departed", "arrived", "delayed", "cancelled"]).optional(),
        gate: z.string().optional(),
        terminal: z.string().optional(),
        economyPrice: z.number().optional(),
        premiumPrice: z.number().optional(),
        businessPrice: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const updateData: any = {};
      if (data.flightNumber) updateData.flightNumber = data.flightNumber;
      if (data.scheduledDeparture) updateData.scheduledDeparture = new Date(data.scheduledDeparture);
      if (data.scheduledArrival) updateData.scheduledArrival = new Date(data.scheduledArrival);
      if (data.status) updateData.status = data.status;
      if (data.gate) updateData.gate = data.gate;
      if (data.terminal) updateData.terminal = data.terminal;
      if (data.economyPrice) updateData.economyPrice = String(data.economyPrice);
      if (data.premiumPrice) updateData.premiumPrice = String(data.premiumPrice);
      if (data.businessPrice) updateData.businessPrice = String(data.businessPrice);

      await db.update(flights).set(updateData).where(eq(flights.id, id));
      return { success: true };
    }),

  // Airport management
  airportList: adminQuery.query(async () => {
    const db = getDb();
    return db.query.airports.findMany({
      orderBy: airports.code,
    });
  }),

  airportCreate: adminQuery
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        city: z.string(),
        country: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(airports).values(input).$returningId();
      return { id };
    }),

  // Aircraft management
  aircraftList: adminQuery.query(async () => {
    const db = getDb();
    return db.query.aircraft.findMany({
      orderBy: aircraft.registrationNumber,
    });
  }),

  aircraftCreate: adminQuery
    .input(
      z.object({
        registrationNumber: z.string(),
        model: z.string(),
        manufacturer: z.string(),
        totalSeats: z.number(),
        economySeats: z.number(),
        premiumSeats: z.number(),
        businessSeats: z.number(),
        status: z.enum(["active", "maintenance", "retired"]).default("active"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(aircraft).values(input).$returningId();
      return { id };
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

      return db.query.bookings.findMany({
        where,
        with: {
          user: true,
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
        },
        orderBy: desc(bookings.createdAt),
        limit: input.limit,
        offset,
      });
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

      return db.query.users.findMany({
        orderBy: desc(users.createdAt),
        limit: input.limit,
        offset,
      });
    }),

  // Maintenance logs
  maintenanceList: adminQuery.query(async () => {
    const db = getDb();
    return db.query.maintenanceLogs.findMany({
      with: {
        aircraft: true,
      },
      orderBy: desc(maintenanceLogs.scheduledDate),
    });
  }),

  // Crew management
  crewList: adminQuery.query(async () => {
    const db = getDb();
    return db.query.crewMembers.findMany({
      orderBy: crewMembers.employeeCode,
    });
  }),
});
