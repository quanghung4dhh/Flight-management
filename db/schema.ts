import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  date,
  datetime,
  boolean,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ==========================================
// 1. USERS (extended from auth)
// ==========================================
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==========================================
// 2. USER PROFILES
// ==========================================
export const userProfiles = mysqlTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id)
    .unique(),
  idCardNumber: varchar("id_card_number", { length: 50 }),
  passportNumber: varchar("passport_number", { length: 50 }),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ==========================================
// 3. AIRPORTS
// ==========================================
export const airports = mysqlTable(
  "airports",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 10 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    country: varchar("country", { length: 255 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    timezone: varchar("timezone", { length: 50 }),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("airport_code_idx").on(table.code),
    index("airport_city_idx").on(table.city),
  ]
);

export type Airport = typeof airports.$inferSelect;
export type InsertAirport = typeof airports.$inferInsert;

// ==========================================
// 4. ROUTES
// ==========================================
export const routes = mysqlTable(
  "routes",
  {
    id: serial("id").primaryKey(),
    departureAirportId: bigint("departure_airport_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => airports.id),
    arrivalAirportId: bigint("arrival_airport_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => airports.id),
    distanceKm: int("distance_km"),
    estimatedDurationMinutes: int("estimated_duration_minutes"),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("route_departure_idx").on(table.departureAirportId),
    index("route_arrival_idx").on(table.arrivalAirportId),
  ]
);

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

// ==========================================
// 5. AIRCRAFT
// ==========================================
export const aircraft = mysqlTable("aircraft", {
  id: serial("id").primaryKey(),
  registrationNumber: varchar("registration_number", { length: 50 })
    .notNull()
    .unique(),
  model: varchar("model", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }).notNull(),
  totalSeats: int("total_seats").notNull(),
  economySeats: int("economy_seats").notNull(),
  premiumSeats: int("premium_seats").notNull().default(0),
  businessSeats: int("business_seats").notNull().default(0),
  manufactureDate: date("manufacture_date"),
  status: mysqlEnum("status", ["active", "maintenance", "retired"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Aircraft = typeof aircraft.$inferSelect;
export type InsertAircraft = typeof aircraft.$inferInsert;

// ==========================================
// 6. MAINTENANCE LOGS
// ==========================================
export const maintenanceLogs = mysqlTable(
  "maintenance_logs",
  {
    id: serial("id").primaryKey(),
    aircraftId: bigint("aircraft_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => aircraft.id),
    maintenanceType: mysqlEnum("maintenance_type", [
      "routine",
      "repair",
      "inspection",
    ]).notNull(),
    description: text("description"),
    scheduledDate: date("scheduled_date").notNull(),
    completedDate: date("completed_date"),
    status: mysqlEnum("status", [
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ])
      .default("scheduled")
      .notNull(),
    performedBy: bigint("performed_by", {
      mode: "number",
      unsigned: true,
    }).references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("maintenance_aircraft_idx").on(table.aircraftId)]
);

export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertMaintenanceLog = typeof maintenanceLogs.$inferInsert;

// ==========================================
// 7. FLIGHTS
// ==========================================
export const flights = mysqlTable(
  "flights",
  {
    id: serial("id").primaryKey(),
    flightNumber: varchar("flight_number", { length: 20 }).notNull().unique(),
    routeId: bigint("route_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => routes.id),
    aircraftId: bigint("aircraft_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => aircraft.id),
    scheduledDeparture: datetime("scheduled_departure").notNull(),
    scheduledArrival: datetime("scheduled_arrival").notNull(),
    actualDeparture: datetime("actual_departure"),
    actualArrival: datetime("actual_arrival"),
    status: mysqlEnum("status", [
      "scheduled",
      "boarding",
      "departed",
      "arrived",
      "delayed",
      "cancelled",
    ])
      .default("scheduled")
      .notNull(),
    gate: varchar("gate", { length: 10 }),
    terminal: varchar("terminal", { length: 10 }),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    economyPrice: decimal("economy_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    premiumPrice: decimal("premium_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    businessPrice: decimal("business_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    createdBy: bigint("created_by", {
      mode: "number",
      unsigned: true,
    }).references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  table => [
    index("flight_number_idx").on(table.flightNumber),
    index("flight_departure_idx").on(table.scheduledDeparture),
    index("flight_status_idx").on(table.status),
    index("flight_route_idx").on(table.routeId),
  ]
);

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = typeof flights.$inferInsert;

// ==========================================
// 8. SEATS
// ==========================================
export const seats = mysqlTable(
  "seats",
  {
    id: serial("id").primaryKey(),
    aircraftId: bigint("aircraft_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => aircraft.id),
    seatNumber: varchar("seat_number", { length: 10 }).notNull(),
    seatClass: mysqlEnum("seat_class", [
      "economy",
      "premium",
      "business",
    ]).notNull(),
    seatType: mysqlEnum("seat_type", [
      "window",
      "aisle",
      "middle",
      "exit_row",
    ]).notNull(),
    extraPrice: decimal("extra_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    seatMapRow: int("seat_map_row").notNull(),
    seatMapCol: int("seat_map_col").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("seat_aircraft_number_idx").on(
      table.aircraftId,
      table.seatNumber
    ),
  ]
);

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

// ==========================================
// 9. FLIGHT SEATS
// ==========================================
export const flightSeats = mysqlTable(
  "flight_seats",
  {
    id: serial("id").primaryKey(),
    flightId: bigint("flight_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => flights.id),
    seatId: bigint("seat_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => seats.id),
    status: mysqlEnum("status", ["available", "occupied", "blocked"])
      .default("available")
      .notNull(),
    bookedBy: bigint("booked_by", {
      mode: "number",
      unsigned: true,
    }).references(() => users.id),
    bookingId: bigint("booking_id", { mode: "number", unsigned: true }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("flight_seat_idx").on(table.flightId, table.seatId),
    index("flight_seat_status_idx").on(table.flightId, table.status),
  ]
);

export type FlightSeat = typeof flightSeats.$inferSelect;
export type InsertFlightSeat = typeof flightSeats.$inferInsert;

// ==========================================
// 10. BOOKINGS
// ==========================================
export const bookings = mysqlTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    bookingCode: varchar("booking_code", { length: 20 }).notNull().unique(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    flightId: bigint("flight_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => flights.id),
    tripType: mysqlEnum("trip_type", ["one_way", "round_trip"])
      .default("one_way")
      .notNull(),
    returnFlightId: bigint("return_flight_id", {
      mode: "number",
      unsigned: true,
    }).references(() => flights.id),
    status: mysqlEnum("status", [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
    ])
      .default("pending")
      .notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    paymentStatus: mysqlEnum("payment_status", [
      "pending",
      "paid",
      "refunded",
      "failed",
    ])
      .default("pending")
      .notNull(),
    passengerDetails: json("passenger_details"),
    contactEmail: varchar("contact_email", { length: 320 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }),
    bookedAt: timestamp("booked_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("booking_user_idx").on(table.userId),
    index("booking_code_idx").on(table.bookingCode),
    index("booking_status_idx").on(table.status),
  ]
);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ==========================================
// 11. TICKETS
// ==========================================
export const tickets = mysqlTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    bookingId: bigint("booking_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bookings.id),
    ticketNumber: varchar("ticket_number", { length: 30 }).notNull().unique(),
    passengerName: varchar("passenger_name", { length: 255 }).notNull(),
    passengerType: mysqlEnum("passenger_type", ["adult", "child", "infant"])
      .default("adult")
      .notNull(),
    seatId: bigint("seat_id", { mode: "number", unsigned: true }).references(
      () => seats.id
    ),
    flightSeatId: bigint("flight_seat_id", {
      mode: "number",
      unsigned: true,
    }).references(() => flightSeats.id),
    status: mysqlEnum("status", ["active", "used", "cancelled", "refunded"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("ticket_booking_idx").on(table.bookingId)]
);

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ==========================================
// 12. PAYMENTS
// ==========================================
export const payments = mysqlTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    bookingId: bigint("booking_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bookings.id),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    method: mysqlEnum("method", [
      "credit_card",
      "debit_card",
      "momo",
      "zalopay",
      "qr_code",
    ]).notNull(),
    status: mysqlEnum("status", ["pending", "success", "failed", "refunded"])
      .default("pending")
      .notNull(),
    transactionId: varchar("transaction_id", { length: 255 }).unique(),
    paymentDetails: json("payment_details"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("payment_booking_idx").on(table.bookingId)]
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==========================================
// 13. CREW MEMBERS
// ==========================================
export const crewMembers = mysqlTable("crew_members", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id)
    .unique(),
  employeeCode: varchar("employee_code", { length: 50 }).notNull().unique(),
  position: mysqlEnum("position", [
    "captain",
    "first_officer",
    "flight_attendant",
  ]).notNull(),
  licenseNumber: varchar("license_number", { length: 100 }),
  totalFlyingHours: int("total_flying_hours").notNull().default(0),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"])
    .default("active")
    .notNull(),
  hiredDate: date("hired_date"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = typeof crewMembers.$inferInsert;

// ==========================================
// 14. FLIGHT CREW
// ==========================================
export const flightCrew = mysqlTable(
  "flight_crew",
  {
    id: serial("id").primaryKey(),
    flightId: bigint("flight_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => flights.id),
    crewMemberId: bigint("crew_member_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => crewMembers.id),
    roleOnFlight: mysqlEnum("role_on_flight", [
      "captain",
      "first_officer",
      "lead_attendant",
      "attendant",
    ]).notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("flight_crew_idx").on(table.flightId, table.crewMemberId),
  ]
);

export type FlightCrew = typeof flightCrew.$inferSelect;
export type InsertFlightCrew = typeof flightCrew.$inferInsert;

// ==========================================
// 15. NOTIFICATIONS
// ==========================================
export const notifications = mysqlTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    type: mysqlEnum("type", [
      "booking_confirm",
      "flight_delay",
      "flight_cancel",
      "reminder",
      "promo",
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("notification_user_idx").on(table.userId),
    index("notification_read_idx").on(table.isRead),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
