/**
 * Query helpers for common database operations
 * Used by tRPC routers to fetch and manipulate data
 */

import { getDb } from "./connection";
import { eq, and } from "drizzle-orm";
import { customers, accounts, bookings, tickets, flights } from "@db/schema";

// ==========================================
// CUSTOMER QUERIES
// ==========================================

export async function getCustomerByAccountId(accountID: string) {
  const db = getDb();
  return await db.query.customers.findFirst({
    where: eq(customers.accountID, accountID),
  });
}

export async function getCustomerById(customerID: string) {
  const db = getDb();
  return await db.query.customers.findFirst({
    where: eq(customers.customerID, customerID),
  });
}

// ==========================================
// BOOKING QUERIES
// ==========================================

export async function getBookingsByCustomerId(customerID: string) {
  const db = getDb();
  return await db.query.bookings.findMany({
    where: eq(bookings.customerID, customerID),
    with: {
      tickets: {
        with: {
          flight: true,
          seat: true,
        },
      },
      payments: true,
    },
  });
}

export async function getBookingById(bookingID: string) {
  const db = getDb();
  return await db.query.bookings.findFirst({
    where: eq(bookings.bookingID, bookingID),
    with: {
      customer: true,
      tickets: {
        with: {
          flight: true,
          seat: true,
          baggage: true,
        },
      },
      payments: true,
    },
  });
}

// ==========================================
// TICKET QUERIES
// ==========================================

export async function getTicketsByBookingId(bookingID: string) {
  const db = getDb();
  return await db.query.tickets.findMany({
    where: eq(tickets.bookingID, bookingID),
    with: {
      flight: true,
      seat: true,
      baggage: true,
    },
  });
}

export async function getTicketById(ticketID: string) {
  const db = getDb();
  return await db.query.tickets.findFirst({
    where: eq(tickets.ticketID, ticketID),
    with: {
      booking: true,
      flight: true,
      seat: true,
      baggage: true,
    },
  });
}

// ==========================================
// FLIGHT QUERIES
// ==========================================

export async function getFlightById(flightID: string) {
  const db = getDb();
  return await db.query.flights.findFirst({
    where: eq(flights.flightID, flightID),
    with: {
      route: {
        with: {
          departureAirport: true,
          arrivalAirport: true,
        },
      },
      aircraft: true,
      pricing: {
        with: {
          seatClass: true,
        },
      },
      crew: {
        with: {
          crew: true,
        },
      },
    },
  });
}
