import { db } from "./index";
import {
  accounts, customers, airports, routes, aircraft,
  seatClass, seats, flights, flightPricing, crew
} from "./schema";
import { nanoid } from "nanoid";
import { hashSync } from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding...");

  // Accounts
  const adminAcc = await db.insert(accounts).values({
    accountID: nanoid(10),
    username: "admin",
    password: hashSync("admin123", 10),
    role: "admin",
    status: "active",
  }).$returningId();

  // Airports
  await db.insert(airports).values([
    { airportID: "HAN", iataCode: "HAN", city: "Hà Nội", country: "Vietnam" },
    { airportID: "SGN", iataCode: "SGN", city: "Hồ Chí Minh", country: "Vietnam" },
    { airportID: "DAD", iataCode: "DAD", city: "Đà Nẵng", country: "Vietnam" },
    { airportID: "PQC", iataCode: "PQC", city: "Phú Quốc", country: "Vietnam" },
  ]);

  // Routes
  await db.insert(routes).values([
    { routeID: nanoid(10), departureAirportID: "HAN", arrivalAirportID: "SGN", distance: 1060, duration: 135 },
    { routeID: nanoid(10), departureAirportID: "SGN", arrivalAirportID: "DAD", distance: 605, duration: 80 },
  ]);

  // Aircraft
  await db.insert(aircraft).values([
    { aircraftID: "VN-A888", model: "Boeing 787-9", manufacturer: "Boeing", capacity: 294, status: "active" },
    { aircraftID: "VN-A350", model: "Airbus A350-900", manufacturer: "Airbus", capacity: 305, status: "active" },
  ]);

  // SeatClass
  await db.insert(seatClass).values([
    { seatClassID: "ECO", name: "Economy" },
    { seatClassID: "BUS", name: "Business" },
  ]);

  // Seats (giả lập 10 ghế cho mỗi máy bay)
  const seatData = [];
  for (const ac of ["VN-A888", "VN-A350"]) {
    for (let i = 1; i <= 10; i++) {
      seatData.push({
        seatID: nanoid(10),
        aircraftID: ac,
        seatClassID: i <= 6 ? "ECO" : "BUS",
        seatNumber: `${Math.ceil(i / 3)}${String.fromCharCode(65 + ((i - 1) % 3))}`,
      });
    }
  }
  await db.insert(seats).values(seatData);

  // Flights
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await db.insert(flights).values([
    {
      flightID: "VN123",
      routeID: (await db.select().from(routes).limit(1))[0].routeID,
      aircraftID: "VN-A888",
      scheduledDeparture: tomorrow,
      scheduledArrival: new Date(tomorrow.getTime() + 135 * 60000),
      status: "scheduled",
    },
  ]);

  // FlightPricing
  await db.insert(flightPricing).values([
    { pricingID: nanoid(10), flightID: "VN123", seatClassID: "ECO", basePrice: "1500000.00" },
    { pricingID: nanoid(10), flightID: "VN123", seatClassID: "BUS", basePrice: "4500000.00" },
  ]);

  // Crew
  await db.insert(crew).values([
    { crewID: nanoid(10), name: "Nguyễn Văn A", role: "pilot", licenseNumber: "VN-PLT-001", status: "active" },
  ]);

  console.log("✅ Seed done!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});