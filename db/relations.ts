import { relations } from "drizzle-orm";
import {
  users,
  userProfiles,
  airports,
  routes,
  aircraft,
  maintenanceLogs,
  flights,
  seats,
  flightSeats,
  bookings,
  tickets,
  payments,
  crewMembers,
  flightCrew,
  notifications,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  bookings: many(bookings),
  notifications: many(notifications),
  crewMember: one(crewMembers, { fields: [users.id], references: [crewMembers.userId] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const airportsRelations = relations(airports, ({ many }) => ({
  departureRoutes: many(routes, { relationName: "departureAirport" }),
  arrivalRoutes: many(routes, { relationName: "arrivalAirport" }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  departureAirport: one(airports, { fields: [routes.departureAirportId], references: [airports.id], relationName: "departureAirport" }),
  arrivalAirport: one(airports, { fields: [routes.arrivalAirportId], references: [airports.id], relationName: "arrivalAirport" }),
  flights: many(flights),
}));

export const aircraftRelations = relations(aircraft, ({ many }) => ({
  flights: many(flights),
  seats: many(seats),
  maintenanceLogs: many(maintenanceLogs),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  aircraft: one(aircraft, { fields: [maintenanceLogs.aircraftId], references: [aircraft.id] }),
  performer: one(users, { fields: [maintenanceLogs.performedBy], references: [users.id] }),
}));

export const flightsRelations = relations(flights, ({ one, many }) => ({
  route: one(routes, { fields: [flights.routeId], references: [routes.id] }),
  aircraft: one(aircraft, { fields: [flights.aircraftId], references: [aircraft.id] }),
  creator: one(users, { fields: [flights.createdBy], references: [users.id] }),
  flightSeats: many(flightSeats),
  bookings: many(bookings),
  flightCrew: many(flightCrew),
  outboundBookings: many(bookings, { relationName: "outboundFlight" }),
  returnBookings: many(bookings, { relationName: "returnFlight" }),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  aircraft: one(aircraft, { fields: [seats.aircraftId], references: [aircraft.id] }),
  flightSeats: many(flightSeats),
}));

export const flightSeatsRelations = relations(flightSeats, ({ one }) => ({
  flight: one(flights, { fields: [flightSeats.flightId], references: [flights.id] }),
  seat: one(seats, { fields: [flightSeats.seatId], references: [seats.id] }),
  bookedByUser: one(users, { fields: [flightSeats.bookedBy], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  flight: one(flights, { fields: [bookings.flightId], references: [flights.id], relationName: "outboundFlight" }),
  returnFlight: one(flights, { fields: [bookings.returnFlightId], references: [flights.id], relationName: "returnFlight" }),
  tickets: many(tickets),
  payments: many(payments),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, { fields: [tickets.bookingId], references: [bookings.id] }),
  seat: one(seats, { fields: [tickets.seatId], references: [seats.id] }),
  flightSeat: one(flightSeats, { fields: [tickets.flightSeatId], references: [flightSeats.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));

export const crewMembersRelations = relations(crewMembers, ({ one, many }) => ({
  user: one(users, { fields: [crewMembers.userId], references: [users.id] }),
  flightAssignments: many(flightCrew),
}));

export const flightCrewRelations = relations(flightCrew, ({ one }) => ({
  flight: one(flights, { fields: [flightCrew.flightId], references: [flights.id] }),
  crewMember: one(crewMembers, { fields: [flightCrew.crewMemberId], references: [crewMembers.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
