import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const seedRouter = createRouter({
  run: publicQuery.mutation(async () => {
    const db = getDb();

    try {
      // Check if data already exists
      const existingAirports = await db.select().from(schema.airports).limit(1);
      if (existingAirports.length > 0) {
        return { message: "Data already seeded" };
      }

      // Seed airports
      await db.insert(schema.airports).values([
        {
          code: "SGN",
          name: "Tan Son Nhat International Airport",
          city: "Ho Chi Minh City",
          country: "Vietnam",
          latitude: "10.81880",
          longitude: "106.65190",
          timezone: "Asia/Ho_Chi_Minh",
        },
        {
          code: "HAN",
          name: "Noi Bai International Airport",
          city: "Hanoi",
          country: "Vietnam",
          latitude: "21.22120",
          longitude: "105.80700",
          timezone: "Asia/Ho_Chi_Minh",
        },
        {
          code: "DAD",
          name: "Da Nang International Airport",
          city: "Da Nang",
          country: "Vietnam",
          latitude: "16.04390",
          longitude: "108.19940",
          timezone: "Asia/Ho_Chi_Minh",
        },
        {
          code: "CXR",
          name: "Cam Ranh International Airport",
          city: "Nha Trang",
          country: "Vietnam",
          latitude: "11.99820",
          longitude: "109.21940",
          timezone: "Asia/Ho_Chi_Minh",
        },
        {
          code: "PQC",
          name: "Phu Quoc International Airport",
          city: "Phu Quoc",
          country: "Vietnam",
          latitude: "10.22700",
          longitude: "103.96770",
          timezone: "Asia/Ho_Chi_Minh",
        },
        {
          code: "BKK",
          name: "Suvarnabhumi Airport",
          city: "Bangkok",
          country: "Thailand",
          latitude: "13.69000",
          longitude: "100.75010",
          timezone: "Asia/Bangkok",
        },
        {
          code: "SIN",
          name: "Changi Airport",
          city: "Singapore",
          country: "Singapore",
          latitude: "1.36440",
          longitude: "103.99150",
          timezone: "Asia/Singapore",
        },
      ] as (typeof schema.airports.$inferInsert)[]);

      // Seed aircraft
      await db.insert(schema.aircraft).values([
        {
          registrationNumber: "VN-A321",
          model: "Airbus A321neo",
          manufacturer: "Airbus",
          totalSeats: 24,
          economySeats: 16,
          premiumSeats: 4,
          businessSeats: 4,
          manufactureDate: "2020-03-15",
          status: "active",
        },
        {
          registrationNumber: "VN-A320",
          model: "Airbus A320neo",
          manufacturer: "Airbus",
          totalSeats: 24,
          economySeats: 16,
          premiumSeats: 4,
          businessSeats: 4,
          manufactureDate: "2019-06-20",
          status: "active",
        },
        {
          registrationNumber: "VN-B787",
          model: "Boeing 787-9",
          manufacturer: "Boeing",
          totalSeats: 24,
          economySeats: 16,
          premiumSeats: 4,
          businessSeats: 4,
          manufactureDate: "2021-01-10",
          status: "active",
        },
      ] as any);

      // Seed routes
      await db.insert(schema.routes).values([
        {
          departureAirportId: 1,
          arrivalAirportId: 2,
          distanceKm: 1060,
          estimatedDurationMinutes: 135,
          status: "active",
        },
        {
          departureAirportId: 2,
          arrivalAirportId: 1,
          distanceKm: 1060,
          estimatedDurationMinutes: 135,
          status: "active",
        },
        {
          departureAirportId: 1,
          arrivalAirportId: 3,
          distanceKm: 605,
          estimatedDurationMinutes: 85,
          status: "active",
        },
        {
          departureAirportId: 3,
          arrivalAirportId: 1,
          distanceKm: 605,
          estimatedDurationMinutes: 85,
          status: "active",
        },
        {
          departureAirportId: 2,
          arrivalAirportId: 3,
          distanceKm: 627,
          estimatedDurationMinutes: 90,
          status: "active",
        },
        {
          departureAirportId: 1,
          arrivalAirportId: 4,
          distanceKm: 311,
          estimatedDurationMinutes: 55,
          status: "active",
        },
      ] as (typeof schema.routes.$inferInsert)[]);

      // Seed seats
      const colLetters = ["A", "B", "C", "D", "E", "F"];
      for (let acId = 1; acId <= 3; acId++) {
        const seatData = [];
        for (let row = 1; row <= 4; row++) {
          for (let col = 0; col < 6; col++) {
            let seatClass: "economy" | "premium" | "business" = "economy";
            if (row === 1) seatClass = "business";
            else if (row === 2) seatClass = "premium";

            const seatType: "window" | "aisle" | "middle" =
              col === 0 || col === 5
                ? "window"
                : col === 2 || col === 3
                  ? "aisle"
                  : "middle";

            seatData.push({
              aircraftId: acId,
              seatNumber: `${row}${colLetters[col]}`,
              seatClass,
              seatType,
              extraPrice:
                seatClass === "business"
                  ? "50"
                  : seatClass === "premium"
                    ? "25"
                    : "0",
              seatMapRow: row,
              seatMapCol: col + 1,
            });
          }
        }
        await db
          .insert(schema.seats)
          .values(seatData as (typeof schema.seats.$inferInsert)[]);
      }

      // Seed flights
      const now = new Date();
      const flightsData = [];
      for (let day = 0; day < 3; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        for (let r = 0; r < 6; r++) {
          const routeId = r + 1;
          const acId = ((day * 6 + r) % 3) + 1;
          const depHour = 7 + (r % 3) * 5;

          const scheduledDeparture = new Date(date);
          scheduledDeparture.setHours(depHour, 0, 0, 0);

          const routeDurations = [135, 135, 85, 85, 90, 55];
          const distances = [1060, 1060, 605, 605, 627, 311];
          const scheduledArrival = new Date(scheduledDeparture);
          scheduledArrival.setMinutes(
            scheduledArrival.getMinutes() + routeDurations[r]
          );

          const basePrice = Math.floor(distances[r] * 1.5);

          flightsData.push({
            flightNumber: `VN${101 + day * 6 + r}`,
            routeId,
            aircraftId: acId,
            scheduledDeparture,
            scheduledArrival,
            status: "scheduled" as const,
            gate: `${String.fromCharCode(65 + (r % 4))}${(day % 5) + 1}`,
            terminal: "1",
            basePrice: String(basePrice),
            economyPrice: String(basePrice),
            premiumPrice: String(Math.floor(basePrice * 1.5)),
            businessPrice: String(Math.floor(basePrice * 2.5)),
          });
        }
      }
      await db
        .insert(schema.flights)
        .values(flightsData as (typeof schema.flights.$inferInsert)[]);

      // Create flight seats
      const allFlights = await db.select().from(schema.flights);
      const allSeats = await db.select().from(schema.seats);

      for (const flight of allFlights) {
        const aircraftSeats = allSeats.filter(
          s => s.aircraftId === flight.aircraftId
        );
        if (aircraftSeats.length > 0) {
          const flightSeatData = aircraftSeats.map(seat => ({
            flightId: flight.id,
            seatId: seat.id,
            status: "available" as const,
          }));
          await db
            .insert(schema.flightSeats)
            .values(
              flightSeatData as (typeof schema.flightSeats.$inferInsert)[]
            );
        }
      }

      // Seed crew members
      await db.insert(schema.crewMembers).values([
        {
          employeeCode: "CREW001",
          position: "captain" as const,
          licenseNumber: "VNCPL-001",
          totalFlyingHours: 8500,
          status: "active" as const,
          hiredDate: "2015-01-15",
        },
        {
          employeeCode: "CREW002",
          position: "first_officer" as const,
          licenseNumber: "VNFO-001",
          totalFlyingHours: 4200,
          status: "active" as const,
          hiredDate: "2019-06-10",
        },
        {
          employeeCode: "CREW003",
          position: "flight_attendant" as const,
          licenseNumber: "VNFA-001",
          totalFlyingHours: 2800,
          status: "active" as const,
          hiredDate: "2018-02-14",
        },
      ] as any);

      // Assign crew to flights
      for (let f = 0; f < Math.min(6, allFlights.length); f++) {
        await db.insert(schema.flightCrew).values([
          {
            flightId: allFlights[f].id,
            crewMemberId: 1,
            roleOnFlight: "captain" as const,
          },
          {
            flightId: allFlights[f].id,
            crewMemberId: 2,
            roleOnFlight: "first_officer" as const,
          },
          {
            flightId: allFlights[f].id,
            crewMemberId: 3,
            roleOnFlight: "lead_attendant" as const,
          },
        ] as (typeof schema.flightCrew.$inferInsert)[]);
      }

      // Seed maintenance logs
      await db.insert(schema.maintenanceLogs).values([
        {
          aircraftId: 1,
          maintenanceType: "routine" as const,
          description: "Regular 500-hour inspection",
          scheduledDate: "2026-05-20",
          status: "scheduled" as const,
          notes: "Standard maintenance cycle",
        },
        {
          aircraftId: 2,
          maintenanceType: "inspection" as const,
          description: "Annual airworthiness inspection",
          scheduledDate: "2026-05-25",
          status: "scheduled" as const,
          notes: "Required by aviation authority",
        },
        {
          aircraftId: 3,
          maintenanceType: "repair" as const,
          description: "Replace hydraulic pump system",
          scheduledDate: "2026-05-18",
          status: "in_progress" as const,
          notes: "Emergency repair priority",
        },
      ] as any);

      return { message: "Seed data inserted successfully" };
    } catch (error: any) {
      return { message: `Error: ${error.message}` };
    }
  }),
});
