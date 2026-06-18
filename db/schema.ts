import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// ==========================================
// ACCOUNTS
// ==========================================
export const accounts = mysqlTable(
  "Accounts",
  {
    accountID: varchar("AccountID", { length: 50 }).primaryKey(),
    username: varchar("Username", { length: 100 }).notNull().unique(),
    password: varchar("Password", { length: 255 }).notNull(),
    role: varchar("Role", { length: 50 }).notNull(),
    status: varchar("Status", { length: 50 }).notNull(),
    createdAt: timestamp("CreatedAt").defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_account_username").on(table.username),
    index("idx_account_role").on(table.role),
  ]
);

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// ==========================================
// CUSTOMERS
// ==========================================
export const customers = mysqlTable(
  "Customers",
  {
    customerID: varchar("CustomerID", { length: 50 }).primaryKey(),
    accountID: varchar("AccountID", { length: 50 })
      .notNull()
      .references(() => accounts.accountID, { onDelete: "cascade" }),
    name: varchar("Name", { length: 255 }).notNull(),
    email: varchar("Email", { length: 255 }).notNull(),
    phone: varchar("Phone", { length: 20 }),
    passport: varchar("Passport", { length: 50 }),
    address: varchar("Address", { length: 500 }),
    birthday: timestamp("Birthday"),
  },
  (table) => [
    index("idx_customer_account").on(table.accountID),
    index("idx_customer_email").on(table.email),
  ]
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ==========================================
// AIRPORTS
// ==========================================
export const airports = mysqlTable(
  "Airport",
  {
    airportID: varchar("AirportID", { length: 50 }).primaryKey(),
    iataCode: varchar("IATACode", { length: 10 }).notNull().unique(),
    city: varchar("City", { length: 100 }).notNull(),
    country: varchar("Country", { length: 100 }).notNull(),
  },
  (table) => [
    index("idx_airport_iata").on(table.iataCode),
    index("idx_airport_city").on(table.city),
  ]
);

export type Airport = typeof airports.$inferSelect;
export type InsertAirport = typeof airports.$inferInsert;

// ==========================================
// ROUTES
// ==========================================
export const routes = mysqlTable(
  "Route",
  {
    routeID: varchar("RouteID", { length: 50 }).primaryKey(),
    departureAirportID: varchar("DepartureAirportID", { length: 50 })
      .notNull()
      .references(() => airports.airportID),
    arrivalAirportID: varchar("ArrivalAirportID", { length: 50 })
      .notNull()
      .references(() => airports.airportID),
    distance: int("Distance"),
    duration: int("Duration"),
  },
  (table) => [
    index("idx_route_departure").on(table.departureAirportID),
    index("idx_route_arrival").on(table.arrivalAirportID),
  ]
);

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

// ==========================================
// AIRCRAFT
// ==========================================
export const aircraft = mysqlTable(
  "Aircraft",
  {
    aircraftID: varchar("AircraftID", { length: 50 }).primaryKey(),
    model: varchar("Model", { length: 100 }).notNull(),
    manufacturer: varchar("Manufacturer", { length: 100 }),
    capacity: int("Capacity").notNull(),
    status: varchar("Status", { length: 50 }).notNull(),
  },
  (table) => [index("idx_aircraft_status").on(table.status)]
);

export type Aircraft = typeof aircraft.$inferSelect;
export type InsertAircraft = typeof aircraft.$inferInsert;

// ==========================================
// MAINTENANCE
// ==========================================
export const maintenance = mysqlTable(
  "Maintenance",
  {
    maintenanceID: varchar("MaintenanceID", { length: 50 }).primaryKey(),
    aircraftID: varchar("AircraftID", { length: 50 })
      .notNull()
      .references(() => aircraft.aircraftID, { onDelete: "cascade" }),
    description: varchar("Description", { length: 1000 }),
    startDate: timestamp("StartDate").notNull(),
    stopDate: timestamp("StopDate"),
    status: varchar("Status", { length: 50 }).notNull(),
  },
  (table) => [
    index("idx_maintenance_aircraft").on(table.aircraftID),
    index("idx_maintenance_status").on(table.status),
  ]
);

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = typeof maintenance.$inferInsert;

// ==========================================
// CREW
// ==========================================
export const crew = mysqlTable("Crew", {
  crewID: varchar("CrewID", { length: 50 }).primaryKey(),
  name: varchar("Name", { length: 255 }).notNull(),
  role: varchar("Role", { length: 100 }).notNull(),
  licenseNumber: varchar("LicenseNumber", { length: 100 }),
  status: varchar("Status", { length: 50 }).notNull(),
});

export type Crew = typeof crew.$inferSelect;
export type InsertCrew = typeof crew.$inferInsert;

// ==========================================
// FLIGHT CREW
// ==========================================
export const flightCrew = mysqlTable(
  "FlightCrew",
  {
    flightCrewID: varchar("FlightCrewID", { length: 50 }).primaryKey(),
    flightID: varchar("FlightID", { length: 50 })
      .notNull()
      .references(() => flights.flightID, { onDelete: "cascade" }),
    crewID: varchar("CrewID", { length: 50 })
      .notNull()
      .references(() => crew.crewID, { onDelete: "cascade" }),
    assignmentRole: varchar("AssignmentRole", { length: 100 }).notNull(),
  },
  (table) => [
    index("idx_flight_crew_flight").on(table.flightID),
    index("idx_flight_crew_crew").on(table.crewID),
  ]
);

export type FlightCrew = typeof flightCrew.$inferSelect;
export type InsertFlightCrew = typeof flightCrew.$inferInsert;

// ==========================================
// SEAT CLASS
// ==========================================
export const seatClass = mysqlTable("SeatClass", {
  seatClassID: varchar("SeatClassID", { length: 50 }).primaryKey(),
  name: varchar("Name", { length: 100 }).notNull(),
});

export type SeatClass = typeof seatClass.$inferSelect;
export type InsertSeatClass = typeof seatClass.$inferInsert;

// ==========================================
// SEATS
// ==========================================
export const seats = mysqlTable(
  "Seat",
  {
    seatID: varchar("SeatID", { length: 50 }).primaryKey(),
    aircraftID: varchar("AircraftID", { length: 50 })
      .notNull()
      .references(() => aircraft.aircraftID, { onDelete: "cascade" }),
    seatClassID: varchar("SeatClassID", { length: 50 })
      .notNull()
      .references(() => seatClass.seatClassID),
    seatNumber: varchar("SeatNumber", { length: 10 }).notNull(),
  },
  (table) => [
    index("idx_seat_aircraft").on(table.aircraftID),
    index("idx_seat_class").on(table.seatClassID),
  ]
);

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

// ==========================================
// FLIGHTS
// ==========================================
export const flights = mysqlTable(
  "Flight",
  {
    flightID: varchar("FlightID", { length: 50 }).primaryKey(),
    routeID: varchar("RouteID", { length: 50 })
      .notNull()
      .references(() => routes.routeID),
    aircraftID: varchar("AircraftID", { length: 50 })
      .notNull()
      .references(() => aircraft.aircraftID),
    scheduledDeparture: timestamp("ScheduledDeparture").notNull(),
    scheduledArrival: timestamp("ScheduledArrival").notNull(),
    actualDeparture: timestamp("ActualDeparture"),
    actualArrival: timestamp("ActualArrival"),
    status: varchar("Status", { length: 50 }).notNull(),
    createdAt: timestamp("CreatedAt").defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_flight_route").on(table.routeID),
    index("idx_flight_aircraft").on(table.aircraftID),
    index("idx_flight_departure").on(table.scheduledDeparture),
    index("idx_flight_status").on(table.status),
  ]
);

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = typeof flights.$inferInsert;

// ==========================================
// FLIGHT PRICING
// ==========================================
export const flightPricing = mysqlTable(
  "FlightPricing",
  {
    pricingID: varchar("PricingID", { length: 50 }).primaryKey(),
    flightID: varchar("FlightID", { length: 50 })
      .notNull()
      .references(() => flights.flightID, { onDelete: "cascade" }),
    seatClassID: varchar("SeatClassID", { length: 50 })
      .notNull()
      .references(() => seatClass.seatClassID),
    basePrice: decimal("BasePrice", { precision: 15, scale: 2 }).notNull(),
  },
  (table) => [
    index("idx_pricing_flight").on(table.flightID),
    index("idx_pricing_class").on(table.seatClassID),
  ]
);

export type FlightPricing = typeof flightPricing.$inferSelect;
export type InsertFlightPricing = typeof flightPricing.$inferInsert;

// ==========================================
// BOOKINGS (dbdiagram.io gốc)
// ==========================================
export const bookings = mysqlTable(
  "Booking",
  {
    bookingID: varchar("BookingID", { length: 50 }).primaryKey(),
    customerID: varchar("CustomerID", { length: 50 })
      .notNull()
      .references(() => customers.customerID, { onDelete: "cascade" }),
    bookDate: timestamp("BookDate").notNull(),
    totalAmount: decimal("TotalAmount", { precision: 15, scale: 2 }).notNull(),
    status: varchar("Status", { length: 50 }).notNull(),
    createdAt: timestamp("CreatedAt").defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_booking_customer").on(table.customerID),
    index("idx_booking_status").on(table.status),
  ]
);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ==========================================
// TICKETS
// ==========================================
export const tickets = mysqlTable(
  "Ticket",
  {
    ticketID: varchar("TicketID", { length: 50 }).primaryKey(),
    bookingID: varchar("BookingID", { length: 50 })
      .notNull()
      .references(() => bookings.bookingID, { onDelete: "cascade" }),
    flightID: varchar("FlightID", { length: 50 })
      .notNull()
      .references(() => flights.flightID),
    seatID: varchar("SeatID", { length: 50 })
      .notNull()
      .references(() => seats.seatID),
    status: varchar("Status", { length: 50 }).notNull(),
    passengerName: varchar("PassengerName", { length: 255 }).notNull(),
    passengerPassport: varchar("PassengerPassport", { length: 50 }),
    passengerDOB: timestamp("PassengerDOB"),
    purchasedPrice: decimal("PurchasedPrice", { precision: 15, scale: 2 }).notNull(),
  },
  (table) => [
    index("idx_ticket_booking").on(table.bookingID),
    index("idx_ticket_flight").on(table.flightID),
    index("idx_ticket_seat").on(table.seatID),
    index("idx_ticket_status").on(table.status),
  ]
);

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ==========================================
// PAYMENTS
// ==========================================
export const payments = mysqlTable(
  "Payment",
  {
    paymentID: varchar("PaymentID", { length: 50 }).primaryKey(),
    transactionID: varchar("TransactionID", { length: 100 }),
    bookingID: varchar("BookingID", { length: 50 })
      .notNull()
      .references(() => bookings.bookingID, { onDelete: "cascade" }),
    payDate: timestamp("PayDate").notNull(),
    status: varchar("Status", { length: 50 }).notNull(),
    method: varchar("Method", { length: 50 }).notNull(),
    createdAt: timestamp("CreatedAt").defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_payment_booking").on(table.bookingID),
    index("idx_payment_status").on(table.status),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==========================================
// BAGGAGE
// ==========================================
export const baggage = mysqlTable(
  "Baggage",
  {
    baggageID: varchar("BaggageID", { length: 50 }).primaryKey(),
    ticketID: varchar("TicketID", { length: 50 })
      .notNull()
      .references(() => tickets.ticketID, { onDelete: "cascade" }),
    weight: int("Weight"),
    price: decimal("Price", { precision: 15, scale: 2 }),
  },
  (table) => [index("idx_baggage_ticket").on(table.ticketID)]
);

export type Baggage = typeof baggage.$inferSelect;
export type InsertBaggage = typeof baggage.$inferInsert;

// ==========================================
// NOTIFICATIONS
// ==========================================
export const notifications = mysqlTable(
  "Notification",
  {
    notificationID: varchar("NotificationID", { length: 50 }).primaryKey(),
    accountID: varchar("AccountID", { length: 50 })
      .notNull()
      .references(() => accounts.accountID, { onDelete: "cascade" }),
    type: varchar("Type", { length: 50 }).notNull(),
    message: varchar("Message", { length: 1000 }).notNull(),
    sentAt: timestamp("SentAt").notNull(),
    status: varchar("Status", { length: 50 }).notNull(),
  },
  (table) => [
    index("idx_notification_account").on(table.accountID),
    index("idx_notification_status").on(table.status),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;