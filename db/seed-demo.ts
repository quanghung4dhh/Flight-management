import { db } from "./index.js";
import * as schema from "./schema.js";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🚀 Starting demo data seeding...");

  try {
    await db.transaction(async tx => {
      // Cleanup
      const tables = [
        schema.notifications,
        schema.baggage,
        schema.payments,
        schema.tickets,
        schema.flightCrew,
        schema.flightPricing,
        schema.seats,
        schema.maintenance,
        schema.bookings,
        schema.flights,
        schema.crew,
        schema.seatClass,
        schema.aircraft,
        schema.routes,
        schema.airports,
        schema.customers,
        schema.accounts,
      ];

      for (const table of tables) {
        await tx.delete(table);
      }
      console.log("🧹 Existing data cleared.");

      // 1. ACCOUNTS
      const adminPassword = bcrypt.hashSync("admin123", 10);
      const customerPassword = bcrypt.hashSync("password123", 10);

      const accountIds = {
        admin: nanoid(10),
        cust1: nanoid(10),
        cust2: nanoid(10),
      };

      await tx.insert(schema.accounts).values([
        {
          accountID: accountIds.admin,
          username: "admin@email.com",
          password: adminPassword,
          role: "admin",
          status: "active",
        },
        {
          accountID: accountIds.cust1,
          username: "customer1@email.com",
          password: customerPassword,
          role: "customer",
          status: "active",
        },
        {
          accountID: accountIds.cust2,
          username: "customer2@email.com",
          password: customerPassword,
          role: "customer",
          status: "active",
        },
      ]);
      console.log("✅ Inserted 3 accounts");

      // 2. CUSTOMERS
      const customerIds = { cust1: nanoid(10), cust2: nanoid(10) };
      await tx.insert(schema.customers).values([
        {
          customerID: customerIds.cust1,
          accountID: accountIds.cust1,
          name: "Nguyễn Văn A",
          email: "vana@example.com",
          phone: "0901234567",
          passport: "PASS123456",
          address: "Quận 1, TP Hồ Chí Minh",
        },
        {
          customerID: customerIds.cust2,
          accountID: accountIds.cust2,
          name: "Trần Thị B",
          email: "thib@example.com",
          phone: "0912345678",
          passport: "PASS654321",
          address: "Quận Hoàn Kiếm, Hà Nội",
        },
      ]);
      console.log("✅ Inserted 2 customers");

      // 3. AIRPORTS
      await tx.insert(schema.airports).values([
        {
          airportID: "HAN",
          iataCode: "HAN",
          city: "Hà Nội",
          country: "Vietnam",
        },
        {
          airportID: "SGN",
          iataCode: "SGN",
          city: "Hồ Chí Minh",
          country: "Vietnam",
        },
        {
          airportID: "DAD",
          iataCode: "DAD",
          city: "Đà Nẵng",
          country: "Vietnam",
        },
        {
          airportID: "PQC",
          iataCode: "PQC",
          city: "Phú Quốc",
          country: "Vietnam",
        },
        {
          airportID: "CXR",
          iataCode: "CXR",
          city: "Cam Ranh",
          country: "Vietnam",
        },
        { airportID: "HUI", iataCode: "HUI", city: "Huế", country: "Vietnam" },
      ]);
      console.log("✅ Inserted 6 airports");

      // 4. ROUTES
      const routePairs = [
        ["HAN", "SGN", 1060, 135],
        ["SGN", "HAN", 1060, 135],
        ["HAN", "DAD", 600, 80],
        ["DAD", "HAN", 600, 80],
        ["SGN", "DAD", 500, 70],
        ["DAD", "SGN", 500, 70],
        ["SGN", "PQC", 200, 50],
        ["PQC", "SGN", 200, 50],
        ["HAN", "CXR", 900, 110],
        ["CXR", "HAN", 900, 110],
        ["DAD", "PQC", 300, 60],
        ["PQC", "DAD", 300, 60],
        ["SGN", "HUI", 670, 90],
        ["HUI", "SGN", 670, 90],
        ["HAN", "PQC", 1200, 150],
        ["PQC", "HAN", 1200, 150],
      ];
      const routeIds = [];
      for (const [dep, arr, dist, dur] of routePairs) {
        const id = nanoid(10);
        routeIds.push(id);
        await tx.insert(schema.routes).values({
          routeID: id,
          departureAirportID: dep,
          arrivalAirportID: arr,
          distance: dist,
          duration: dur,
        });
      }
      console.log(`✅ Inserted ${routeIds.length} routes`);

      // 5. SEAT CLASS
      await tx.insert(schema.seatClass).values([
        { seatClassID: "ECO", name: "Economy" },
        { seatClassID: "BUS", name: "Business" },
        { seatClassID: "FST", name: "First Class" },
      ]);
      console.log("✅ Inserted 3 seat classes");

      // 6. AIRCRAFT
      const aircraftData = [
        {
          aircraftID: "VN-A888",
          model: "Boeing 787-9",
          manufacturer: "Boeing",
          capacity: 294,
          status: "active",
        },
        {
          aircraftID: "VN-A350",
          model: "Airbus A350-900",
          manufacturer: "Airbus",
          capacity: 305,
          status: "active",
        },
        {
          aircraftID: "VN-A321",
          model: "Airbus A321neo",
          manufacturer: "Airbus",
          capacity: 195,
          status: "maintenance",
        },
      ];
      await tx.insert(schema.aircraft).values(aircraftData);
      console.log("✅ Inserted 3 aircraft");

      // 7. SEATS
      const seatIds = [];
      for (const config of [
        { id: "VN-A888", eco: 240, bus: 40, fst: 14 },
        { id: "VN-A350", eco: 250, bus: 45, fst: 10 },
        { id: "VN-A321", eco: 170, bus: 20, fst: 5 },
      ]) {
        const seatsToInsert = [];
        let seatCounter = 1;
        const chars = ["A", "B", "C", "D", "E", "F"];
        for (const cls of ["FST", "BUS", "ECO"]) {
          const count =
            cls === "FST"
              ? config.fst
              : cls === "BUS"
                ? config.bus
                : config.eco;
          for (let i = 0; i < count; i++) {
            const row = Math.ceil(seatCounter / 6);
            const col = chars[(seatCounter - 1) % 6];
            const seatId = nanoid(10);
            seatIds.push(seatId);
            seatsToInsert.push({
              seatID: seatId,
              aircraftID: config.id,
              seatClassID: cls,
              seatNumber: `${row}${col}`,
            });
            seatCounter++;
          }
        }
        await tx.insert(schema.seats).values(seatsToInsert);
      }
      console.log(`✅ Inserted ${seatIds.length} seats`);

      // 8. FLIGHTS
      const flightIds = [];
      const today = new Date();
      for (let i = 0; i < 15; i++) {
        const flightDate = new Date(today);
        flightDate.setDate(today.getDate() + Math.floor(Math.random() * 7));
        flightDate.setHours(8 + Math.floor(Math.random() * 12), 0, 0);
        const routeId = routeIds[Math.floor(Math.random() * routeIds.length)];
        const aircraftId =
          aircraftData[Math.floor(Math.random() * aircraftData.length)]
            .aircraftID;
        const statusArr = [
          "scheduled",
          "boarding",
          "departed",
          "arrived",
          "cancelled",
        ];
        const status = statusArr[Math.floor(Math.random() * statusArr.length)];
        const flightId = nanoid(10);
        flightIds.push(flightId);
        let actualDeparture = null;
        let actualArrival = null;
        if (status === "departed" || status === "arrived") {
          actualDeparture = new Date(flightDate);
          actualDeparture.setMinutes(actualDeparture.getMinutes() + 15);
        }
        if (status === "arrived") {
          actualArrival = new Date(flightDate);
          actualArrival.setHours(actualArrival.getHours() + 2);
        }
        await tx.insert(schema.flights).values({
          flightID: flightId,
          routeID: routeId,
          aircraftID: aircraftId,
          scheduledDeparture: flightDate,
          scheduledArrival: new Date(flightDate.getTime() + 2 * 60 * 60 * 1000),
          actualDeparture,
          actualArrival,
          status,
        });
      }
      console.log(`✅ Inserted ${flightIds.length} flights`);

      // 9. FLIGHTPRICING
      for (const fId of flightIds) {
        await tx.insert(schema.flightPricing).values([
          {
            pricingID: nanoid(10),
            flightID: fId,
            seatClassID: "ECO",
            basePrice: (1500000 + Math.random() * 1000000).toFixed(2),
          },
          {
            pricingID: nanoid(10),
            flightID: fId,
            seatClassID: "BUS",
            basePrice: (4000000 + Math.random() * 2000000).toFixed(2),
          },
          {
            pricingID: nanoid(10),
            flightID: fId,
            seatClassID: "FST",
            basePrice: (8000000 + Math.random() * 4000000).toFixed(2),
          },
        ]);
      }
      console.log("✅ Inserted pricing for all flights");

      // 10. CREW
      const crewIds = [];
      const names = [
        "Nguyễn Nam",
        "Trần Bắc",
        "Lê Cường",
        "Phạm Đông",
        "Hoàng An",
        "Vũ Bình",
        "Đặng Cường",
        "Bùi Duy",
      ];
      const crewRoles = [
        { role: "Captain", count: 2 },
        { role: "First Officer", count: 2 },
        { role: "Flight Attendant", count: 4 },
      ];
      let nameIdx = 0;
      for (const group of crewRoles) {
        for (let i = 0; i < group.count; i++) {
          const id = nanoid(10);
          crewIds.push(id);
          await tx.insert(schema.crew).values({
            crewID: id,
            name: names[nameIdx++],
            role: group.role,
            licenseNumber: `LIC-${nanoid(6).toUpperCase()}`,
            status: "active",
          });
        }
      }
      console.log(`✅ Inserted ${crewIds.length} crew members`);

      // 11. FLIGHTCREW
      for (const fId of flightIds) {
        const shuffled = [...crewIds].sort(() => Math.random() - 0.5);
        await tx.insert(schema.flightCrew).values([
          {
            flightCrewID: nanoid(10),
            flightID: fId,
            crewID: shuffled[0],
            assignmentRole: "Captain",
          },
          {
            flightCrewID: nanoid(10),
            flightID: fId,
            crewID: shuffled[1],
            assignmentRole: "First Officer",
          },
          {
            flightCrewID: nanoid(10),
            flightID: fId,
            crewID: shuffled[2],
            assignmentRole: "Flight Attendant",
          },
          {
            flightCrewID: nanoid(10),
            flightID: fId,
            crewID: shuffled[3],
            assignmentRole: "Flight Attendant",
          },
        ]);
      }
      console.log("✅ Assigned crew to flights");

      // 12. BOOKINGS (schema dbdiagram.io gốc - đơn giản)
      const bookingStatuses = [
        "confirmed",
        "confirmed",
        "pending",
        "pending",
        "cancelled",
      ];
      const bookingIds = [];
      for (let i = 0; i < 5; i++) {
        const bId = nanoid(10);
        bookingIds.push(bId);
        await tx.insert(schema.bookings).values({
          bookingID: bId,
          customerID: i % 2 === 0 ? customerIds.cust1 : customerIds.cust2,
          bookDate: new Date(),
          totalAmount: (2000000 * (i + 1)).toFixed(2),
          status: bookingStatuses[i],
        });
      }
      console.log(`✅ Inserted ${bookingIds.length} bookings`);

      // 13. TICKETS
      const ticketIds = [];
      for (let i = 0; i < bookingIds.length; i++) {
        const ticketCount = Math.floor(Math.random() * 2) + 1;
        const fId = flightIds[Math.floor(Math.random() * flightIds.length)];
        const sId = seatIds[Math.floor(Math.random() * seatIds.length)];
        for (let j = 0; j < ticketCount; j++) {
          const tId = nanoid(10);
          ticketIds.push(tId);
          await tx.insert(schema.tickets).values({
            ticketID: tId,
            bookingID: bookingIds[i],
            flightID: fId,
            seatID: sId,
            status: bookingStatuses[i] === "cancelled" ? "cancelled" : "active",
            passengerName: `Passenger ${i + 1}-${j + 1}`,
            passengerPassport: `PP${nanoid(6).toUpperCase()}`,
            passengerDOB: new Date("1990-01-01"),
            purchasedPrice: (Number(2000000 * (i + 1)) / ticketCount).toFixed(
              2
            ),
          });
        }
      }
      console.log(`✅ Inserted ${ticketIds.length} tickets`);

      // 14. PAYMENTS
      for (let i = 0; i < bookingIds.length; i++) {
        const status =
          bookingStatuses[i] === "confirmed"
            ? "paid"
            : bookingStatuses[i] === "cancelled"
              ? "refunded"
              : "pending";
        await tx.insert(schema.payments).values({
          paymentID: nanoid(10),
          transactionID: "TX-" + nanoid(10).toUpperCase(),
          bookingID: bookingIds[i],
          payDate: new Date(),
          status,
          method: ["credit_card", "bank_transfer", "momo"][i % 3],
        });
      }
      console.log(`✅ Inserted ${bookingIds.length} payments`);

      // 15. BAGGAGE
      for (let i = 0; i < 3 && i < ticketIds.length; i++) {
        await tx.insert(schema.baggage).values({
          baggageID: nanoid(10),
          ticketID: ticketIds[i],
          weight: [15, 20, 23][i],
          price: ([15, 20, 23][i] * 50000).toFixed(2),
        });
      }
      console.log("✅ Inserted baggage records");

      // 16. MAINTENANCE
      await tx.insert(schema.maintenance).values([
        {
          maintenanceID: nanoid(10),
          aircraftID: "VN-A321",
          description: "Routine check engine",
          startDate: new Date("2024-06-01"),
          stopDate: new Date("2024-06-05"),
          status: "completed",
        },
        {
          maintenanceID: nanoid(10),
          aircraftID: "VN-A321",
          description: "Interior repair",
          startDate: new Date(),
          stopDate: null,
          status: "in_progress",
        },
      ]);
      console.log("✅ Inserted maintenance records");

      // 17. NOTIFICATIONS
      const allAccounts = [
        accountIds.admin,
        accountIds.cust1,
        accountIds.cust2,
      ];
      for (let i = 0; i < 5; i++) {
        await tx.insert(schema.notifications).values({
          notificationID: nanoid(10),
          accountID: allAccounts[i % 3],
          type: ["booking", "flight_update", "payment", "promo"][i % 4],
          message: "Notification message " + (i + 1),
          sentAt: new Date(),
          status: i % 2 === 0 ? "read" : "sent",
        });
      }
      console.log("✅ Inserted notifications");
    });
    console.log("\n🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
