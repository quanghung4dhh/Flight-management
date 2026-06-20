import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import bcryptjs from "bcryptjs";

export const seedRouter = createRouter({
  run: publicQuery.mutation(async () => {
    const db = getDb();

    try {
      const existingAirports = await db.select().from(schema.airports).limit(1);
      if (existingAirports.length > 0) {
        return { message: "Data already seeded" };
      }

      // ==========================================
      // 1. TẠO TÀI KHOẢN ADMIN & TEST
      // ==========================================
      const adminPassword = bcryptjs.hashSync("admin123", 10);
      const testPassword = bcryptjs.hashSync("test123", 10);

      await db.insert(schema.accounts).values([
        {
          accountID: "ACC-ADMIN-01",
          username: "admin",
          password: adminPassword,
          role: "admin",
          status: "active",
        },
        {
          accountID: "ACC-TEST-01",
          username: "test",
          password: testPassword,
          role: "customer",
          status: "active",
        },
      ] as (typeof schema.accounts.$inferInsert)[]);

      await db.insert(schema.customers).values([
        {
          customerID: "ACC-ADMIN-01",
          accountID: "ACC-ADMIN-01",
          name: "Quản trị viên",
          email: "admin@skyviet.com",
          phone: null,
          passport: null,
          address: null,
          birthday: null,
        },
        {
          customerID: "ACC-TEST-01",
          accountID: "ACC-TEST-01",
          name: "Khách hàng Test",
          email: "test@skyviet.com",
          phone: "0901234567",
          passport: null,
          address: "TP. Hồ Chí Minh",
          birthday: null,
        },
      ] as (typeof schema.customers.$inferInsert)[]);

      // ==========================================
      // 2. SEED AIRPORTS
      // ==========================================
      await db.insert(schema.airports).values([
        {
          airportID: "AP-SGN",
          iataCode: "SGN",
          city: "Ho Chi Minh City",
          country: "Vietnam",
        },
        {
          airportID: "AP-HAN",
          iataCode: "HAN",
          city: "Hanoi",
          country: "Vietnam",
        },
        {
          airportID: "AP-DAD",
          iataCode: "DAD",
          city: "Da Nang",
          country: "Vietnam",
        },
        {
          airportID: "AP-CXR",
          iataCode: "CXR",
          city: "Nha Trang",
          country: "Vietnam",
        },
        {
          airportID: "AP-PQC",
          iataCode: "PQC",
          city: "Phu Quoc",
          country: "Vietnam",
        },
        {
          airportID: "AP-BKK",
          iataCode: "BKK",
          city: "Bangkok",
          country: "Thailand",
        },
        {
          airportID: "AP-SIN",
          iataCode: "SIN",
          city: "Singapore",
          country: "Singapore",
        },
      ] as (typeof schema.airports.$inferInsert)[]);

      // ... phần còn lại giữ nguyên (aircraft, routes, seatClass, seats, flights, pricing, crew, maintenance) ...
      // ==========================================
      // 3. SEED AIRCRAFT
      // ==========================================
      await db.insert(schema.aircraft).values([
        {
          aircraftID: "AC-001",
          model: "Airbus A321neo",
          manufacturer: "Airbus",
          capacity: 200,
          status: "active",
        },
        {
          aircraftID: "AC-002",
          model: "Airbus A320neo",
          manufacturer: "Airbus",
          capacity: 180,
          status: "active",
        },
        {
          aircraftID: "AC-003",
          model: "Boeing 787-9",
          manufacturer: "Boeing",
          capacity: 290,
          status: "active",
        },
      ] as (typeof schema.aircraft.$inferInsert)[]);

      // ==========================================
      // 4. SEED ROUTES
      // ==========================================
      await db.insert(schema.routes).values([
        {
          routeID: "RT-001",
          departureAirportID: "AP-SGN",
          arrivalAirportID: "AP-HAN",
          distance: 1060,
          duration: 135,
        },
        {
          routeID: "RT-002",
          departureAirportID: "AP-HAN",
          arrivalAirportID: "AP-SGN",
          distance: 1060,
          duration: 135,
        },
        {
          routeID: "RT-003",
          departureAirportID: "AP-SGN",
          arrivalAirportID: "AP-DAD",
          distance: 605,
          duration: 85,
        },
        {
          routeID: "RT-004",
          departureAirportID: "AP-DAD",
          arrivalAirportID: "AP-SGN",
          distance: 605,
          duration: 85,
        },
        {
          routeID: "RT-005",
          departureAirportID: "AP-HAN",
          arrivalAirportID: "AP-DAD",
          distance: 627,
          duration: 90,
        },
        {
          routeID: "RT-006",
          departureAirportID: "AP-SGN",
          arrivalAirportID: "AP-CXR",
          distance: 311,
          duration: 55,
        },
      ] as (typeof schema.routes.$inferInsert)[]);

      // ==========================================
      // 5. SEAT CLASSES
      // ==========================================
      await db.insert(schema.seatClass).values([
        { seatClassID: "ECO", name: "Economy" },
        { seatClassID: "BUS", name: "Business" },
        { seatClassID: "FST", name: "First Class" },
      ] as (typeof schema.seatClass.$inferInsert)[]);

      // ==========================================
      // 6. SEATS
      // ==========================================
      const colLetters = ["A", "B", "C", "D", "E", "F"];
      const aircraftList = await db.select().from(schema.aircraft);

      for (const ac of aircraftList) {
        const seatData = [];
        for (let row = 1; row <= 4; row++) {
          for (let col = 0; col < 6; col++) {
            let seatClassID = "ECO";
            if (row === 1) seatClassID = "BUS";
            else if (row === 2) seatClassID = "FST";

            seatData.push({
              seatID: `ST-${ac.aircraftID}-${row}${colLetters[col]}`,
              aircraftID: ac.aircraftID,
              seatClassID,
              seatNumber: `${row}${colLetters[col]}`,
            });
          }
        }
        await db
          .insert(schema.seats)
          .values(seatData as (typeof schema.seats.$inferInsert)[]);
      }

      // ==========================================
      // 7. FLIGHTS
      // ==========================================
      const now = new Date();
      const flightsData = [];
      const routesList = await db.select().from(schema.routes);

      for (let day = 0; day < 3; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);

        for (let r = 0; r < routesList.length; r++) {
          const route = routesList[r];
          const ac = aircraftList[r % aircraftList.length];
          const depHour = 7 + (r % 3) * 5;

          const scheduledDeparture = new Date(date);
          scheduledDeparture.setHours(depHour, 0, 0, 0);

          const scheduledArrival = new Date(scheduledDeparture);
          scheduledArrival.setMinutes(
            scheduledArrival.getMinutes() + (route.duration || 90)
          );

          flightsData.push({
            flightID: `FL-${day}-${r}`,
            routeID: route.routeID,
            aircraftID: ac.aircraftID,
            scheduledDeparture,
            scheduledArrival,
            status: "scheduled" as const,
          });
        }
      }
      await db
        .insert(schema.flights)
        .values(flightsData as (typeof schema.flights.$inferInsert)[]);

      // ==========================================
      // 8. FLIGHT PRICING
      // ==========================================
      const allFlights = await db.select().from(schema.flights);
      const seatClasses = await db.select().from(schema.seatClass);

      for (const flight of allFlights) {
        const route = routesList.find(r => r.routeID === flight.routeID);
        const basePrice = Math.floor((route?.distance || 500) * 1.5);

        for (const sc of seatClasses) {
          let multiplier = 1;
          if (sc.seatClassID === "BUS") multiplier = 2.5;
          if (sc.seatClassID === "FST") multiplier = 4;

          await db.insert(schema.flightPricing).values({
            pricingID: `PR-${flight.flightID}-${sc.seatClassID}`,
            flightID: flight.flightID,
            seatClassID: sc.seatClassID,
            basePrice: String(Math.floor(basePrice * multiplier)),
          } as typeof schema.flightPricing.$inferInsert);
        }
      }

      // ==========================================
      // 9. CREW
      // ==========================================
      await db.insert(schema.crew).values([
        {
          crewID: "CR-001",
          name: "Nguyen Van A",
          role: "captain",
          licenseNumber: "VNCPL-001",
          status: "active",
        },
        {
          crewID: "CR-002",
          name: "Tran Van B",
          role: "first_officer",
          licenseNumber: "VNFO-001",
          status: "active",
        },
        {
          crewID: "CR-003",
          name: "Le Thi C",
          role: "flight_attendant",
          licenseNumber: "VNFA-001",
          status: "active",
        },
      ] as (typeof schema.crew.$inferInsert)[]);

      // ==========================================
      // 10. FLIGHT CREW ASSIGNMENTS
      // ==========================================
      const crewList = await db.select().from(schema.crew);
      for (let f = 0; f < Math.min(6, allFlights.length); f++) {
        await db.insert(schema.flightCrew).values([
          {
            flightCrewID: `FC-${f}-1`,
            flightID: allFlights[f].flightID,
            crewID: crewList[0].crewID,
            assignmentRole: "captain",
          },
          {
            flightCrewID: `FC-${f}-2`,
            flightID: allFlights[f].flightID,
            crewID: crewList[1].crewID,
            assignmentRole: "first_officer",
          },
          {
            flightCrewID: `FC-${f}-3`,
            flightID: allFlights[f].flightID,
            crewID: crewList[2].crewID,
            assignmentRole: "lead_attendant",
          },
        ] as (typeof schema.flightCrew.$inferInsert)[]);
      }

      // ==========================================
      // 11. MAINTENANCE
      // ==========================================
      await db.insert(schema.maintenance).values([
        {
          maintenanceID: "MN-001",
          aircraftID: "AC-001",
          description: "Regular 500-hour inspection",
          startDate: new Date("2026-05-20"),
          status: "scheduled",
        },
        {
          maintenanceID: "MN-002",
          aircraftID: "AC-002",
          description: "Annual airworthiness inspection",
          startDate: new Date("2026-05-25"),
          status: "scheduled",
        },
        {
          maintenanceID: "MN-003",
          aircraftID: "AC-003",
          description: "Replace hydraulic pump system",
          startDate: new Date("2026-05-18"),
          stopDate: new Date("2026-05-22"),
          status: "completed",
        },
      ] as (typeof schema.maintenance.$inferInsert)[]);

      return { message: "Seed data inserted successfully" };
    } catch (error: any) {
      return { message: `Error: ${error.message}` };
    }
  }),
});