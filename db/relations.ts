import { relations } from "drizzle-orm";
import {
  accounts,
  customers,
  notifications,
  airports,
  routes,
  aircraft,
  maintenance,
  crew,
  flightCrew,
  flights,
  seatClass,
  seats,
  flightPricing,
  bookings,
  tickets,
  payments,
  baggage,
} from "./schema";

// Accounts -> Customers (1:1)
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [accounts.accountID],
    references: [customers.accountID],
  }),
  notifications: many(notifications),
}));

// Customers -> Accounts (1:1), Customers -> Bookings (1:N)
export const customersRelations = relations(customers, ({ one, many }) => ({
  account: one(accounts, {
    fields: [customers.accountID],
    references: [accounts.accountID],
  }),
  bookings: many(bookings),
}));

// Notifications -> Accounts (N:1)
export const notificationsRelations = relations(notifications, ({ one }) => ({
  account: one(accounts, {
    fields: [notifications.accountID],
    references: [accounts.accountID],
  }),
}));

// Airports -> Routes (1:N as departure), Airports -> Routes (1:N as arrival)
export const airportsRelations = relations(airports, ({ many }) => ({
  departureRoutes: many(routes, { relationName: "departureAirport" }),
  arrivalRoutes: many(routes, { relationName: "arrivalAirport" }),
}));

// Routes -> Airports (N:1), Routes -> Flights (1:N)
export const routesRelations = relations(routes, ({ one, many }) => ({
  departureAirport: one(airports, {
    fields: [routes.departureAirportID],
    references: [airports.airportID],
    relationName: "departureAirport",
  }),
  arrivalAirport: one(airports, {
    fields: [routes.arrivalAirportID],
    references: [airports.airportID],
    relationName: "arrivalAirport",
  }),
  flights: many(flights),
}));

// Aircraft -> Flights (1:N), Aircraft -> Maintenance (1:N), Aircraft -> Seats (1:N)
export const aircraftRelations = relations(aircraft, ({ many }) => ({
  flights: many(flights),
  maintenance: many(maintenance),
  seats: many(seats),
}));

// Maintenance -> Aircraft (N:1)
export const maintenanceRelations = relations(maintenance, ({ one }) => ({
  aircraft: one(aircraft, {
    fields: [maintenance.aircraftID],
    references: [aircraft.aircraftID],
  }),
}));

// Crew -> FlightCrew (1:N)
export const crewRelations = relations(crew, ({ many }) => ({
  flightAssignments: many(flightCrew),
}));

// FlightCrew -> Flight (N:1), FlightCrew -> Crew (N:1)
export const flightCrewRelations = relations(flightCrew, ({ one }) => ({
  flight: one(flights, {
    fields: [flightCrew.flightID],
    references: [flights.flightID],
  }),
  crew: one(crew, {
    fields: [flightCrew.crewID],
    references: [crew.crewID],
  }),
}));

// Flights -> Route (N:1), Flights -> Aircraft (N:1), Flights -> FlightCrew (1:N), Flights -> FlightPricing (1:N), Flights -> Tickets (1:N)
export const flightsRelations = relations(flights, ({ one, many }) => ({
  route: one(routes, {
    fields: [flights.routeID],
    references: [routes.routeID],
  }),
  aircraft: one(aircraft, {
    fields: [flights.aircraftID],
    references: [aircraft.aircraftID],
  }),
  crew: many(flightCrew),
  pricing: many(flightPricing),
  tickets: many(tickets),
}));

// SeatClass -> Seats (1:N), SeatClass -> FlightPricing (1:N)
export const seatClassRelations = relations(seatClass, ({ many }) => ({
  seats: many(seats),
  pricing: many(flightPricing),
}));

// Seats -> Aircraft (N:1), Seats -> SeatClass (N:1), Seats -> Tickets (1:N)
export const seatsRelations = relations(seats, ({ one, many }) => ({
  aircraft: one(aircraft, {
    fields: [seats.aircraftID],
    references: [aircraft.aircraftID],
  }),
  seatClass: one(seatClass, {
    fields: [seats.seatClassID],
    references: [seatClass.seatClassID],
  }),
  tickets: many(tickets),
}));

// FlightPricing -> Flight (N:1), FlightPricing -> SeatClass (N:1)
export const flightPricingRelations = relations(flightPricing, ({ one }) => ({
  flight: one(flights, {
    fields: [flightPricing.flightID],
    references: [flights.flightID],
  }),
  seatClass: one(seatClass, {
    fields: [flightPricing.seatClassID],
    references: [seatClass.seatClassID],
  }),
}));

// Bookings -> Customers (N:1), Bookings -> Tickets (1:N), Bookings -> Payments (1:N)
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bookings.customerID],
    references: [customers.customerID],
  }),
  tickets: many(tickets),
  payments: many(payments),
}));

// Tickets -> Booking (N:1), Tickets -> Flight (N:1), Tickets -> Seat (N:1), Tickets -> Baggage (1:N)
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingID],
    references: [bookings.bookingID],
  }),
  flight: one(flights, {
    fields: [tickets.flightID],
    references: [flights.flightID],
  }),
  seat: one(seats, {
    fields: [tickets.seatID],
    references: [seats.seatID],
  }),
  baggage: many(baggage),
}));

// Payments -> Booking (N:1)
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingID],
    references: [bookings.bookingID],
  }),
}));

// Baggage -> Ticket (N:1)
export const baggageRelations = relations(baggage, ({ one }) => ({
  ticket: one(tickets, {
    fields: [baggage.ticketID],
    references: [tickets.ticketID],
  }),
}));