import { z } from "zod";

// ==========================================
// AUTH SCHEMAS
// ==========================================
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "customer", "staff"]).default("customer"),
});

// ==========================================
// AIRPORT SCHEMAS
// ==========================================
export const createAirportSchema = z.object({
  airportID: z.string(),
  iataCode: z.string().length(3, "IATA code must be 3 characters"),
  city: z.string(),
  country: z.string(),
});

export const updateAirportSchema = createAirportSchema.partial();

// ==========================================
// ROUTE SCHEMAS
// ==========================================
export const createRouteSchema = z.object({
  routeID: z.string(),
  departureAirportID: z.string(),
  arrivalAirportID: z.string(),
  distance: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
});

export const updateRouteSchema = createRouteSchema.partial();

// ==========================================
// FLIGHT SCHEMAS
// ==========================================
export const flightSearchSchema = z.object({
  departureAirportID: z.string(),
  arrivalAirportID: z.string(),
  departureDate: z.string().datetime().or(z.string().date()),
  returnDate: z.string().datetime().or(z.string().date()).optional(),
  passengers: z.number().int().positive().default(1),
});

export const createFlightSchema = z.object({
  flightID: z.string(),
  routeID: z.string(),
  aircraftID: z.string(),
  scheduledDeparture: z.string().datetime(),
  scheduledArrival: z.string().datetime(),
  status: z.string().default("scheduled"),
});

export const updateFlightStatusSchema = z.object({
  flightID: z.string(),
  status: z.enum([
    "scheduled",
    "boarding",
    "departed",
    "arrived",
    "cancelled",
    "delayed",
  ]),
});

// ==========================================
// AIRCRAFT SCHEMAS
// ==========================================
export const createAircraftSchema = z.object({
  aircraftID: z.string(),
  model: z.string(),
  manufacturer: z.string(),
  capacity: z.number().int().positive(),
});

// ==========================================
// SEAT SCHEMAS
// ==========================================
export const seatAvailabilitySchema = z.object({
  flightID: z.string(),
  seatClassID: z.string().optional(),
});

// ==========================================
// SEAT CLASS SCHEMAS
// ==========================================
export const createSeatClassSchema = z.object({
  seatClassID: z.string(),
  name: z.string(),
});

// ==========================================
// BOOKING SCHEMAS
// ==========================================
export const createBookingSchema = z.object({
  customerID: z.string(),
  flightID: z.string(),
  tickets: z.array(
    z.object({
      seatID: z.string(),
      passengerName: z.string(),
      passengerPassport: z.string(),
      passengerDOB: z.string().datetime(),
    })
  ),
  baggage: z
    .array(
      z.object({
        weight: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .optional(),
});

export const cancelBookingSchema = z.object({
  bookingID: z.string(),
});

// ==========================================
// TICKET SCHEMAS
// ==========================================
export const createTicketSchema = z.object({
  bookingID: z.string(),
  flightID: z.string(),
  seatID: z.string(),
  passengerName: z.string(),
  passengerPassport: z.string(),
  passengerDOB: z.string().datetime(),
  purchasedPrice: z.number().positive(),
});

export const updateTicketStatusSchema = z.object({
  ticketID: z.string(),
  status: z.enum(["active", "used", "cancelled"]),
});

// ==========================================
// PAYMENT SCHEMAS
// ==========================================
export const createPaymentSchema = z.object({
  bookingID: z.string(),
  method: z.string(),
  amount: z.number().positive(),
});

export const updatePaymentStatusSchema = z.object({
  paymentID: z.string(),
  status: z.enum(["pending", "paid", "failed", "refunded"]),
});

// ==========================================
// CUSTOMER SCHEMAS
// ==========================================
export const updateCustomerProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  passport: z.string().optional(),
  address: z.string().optional(),
  birthday: z.string().datetime().optional(),
});

// ==========================================
// NOTIFICATION SCHEMAS
// ==========================================
export const markNotificationAsReadSchema = z.object({
  notificationID: z.string(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type FlightSearchInput = z.infer<typeof flightSearchSchema>;
export type CreateFlightInput = z.infer<typeof createFlightSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdateCustomerProfileInput = z.infer<
  typeof updateCustomerProfileSchema
>;
