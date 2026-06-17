# Flight Management System - Design Document

## Overview

A full-stack flight management web application with Customer Portal (search, book, pay, manage bookings) and Admin Portal (manage flights, airports, aircraft, pricing, revenue reports). Crew and Maintenance portals with basic functionality. Vietnamese (primary) and English (secondary) via i18n.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: tRPC + Drizzle ORM + Hono + MySQL
- **Auth**: Kimi OAuth 2.0 (built-in)
- **i18n**: react-i18next + i18next + i18next-browser-languagedetector
- **Charts**: Recharts
- **State**: React Query (via tRPC) + local state

## Database Schema (MySQL via Drizzle ORM)

### Tables

#### 1. users (already provided by auth)

- id: serial PK
- unionId: varchar(255) unique
- name: varchar(255)
- email: varchar(320)
- avatar: text
- role: enum ['user', 'admin'] default 'user'
- createdAt: timestamp
- updatedAt: timestamp
- lastSignInAt: timestamp

#### 2. user_profiles

- id: serial PK
- userId: bigint unsigned FK → users.id
- phone: varchar(20)
- idCardNumber: varchar(50)
- passportNumber: varchar(50)
- dateOfBirth: date
- nationality: varchar(100)
- createdAt: timestamp

#### 3. airports

- id: serial PK
- code: varchar(10) unique "SGN, HAN, DAD, etc."
- name: varchar(255)
- city: varchar(255)
- country: varchar(255)
- latitude: decimal(10,8)
- longitude: decimal(11,8)
- timezone: varchar(50)
- status: enum ['active', 'inactive'] default 'active'
- createdAt: timestamp

#### 4. routes

- id: serial PK
- departureAirportId: bigint unsigned FK → airports.id
- arrivalAirportId: bigint unsigned FK → airports.id
- distanceKm: int
- estimatedDurationMinutes: int
- status: enum ['active', 'inactive'] default 'active'
- createdAt: timestamp

#### 5. aircraft

- id: serial PK
- registrationNumber: varchar(50) unique
- model: varchar(255) "Airbus A320, Boeing 787"
- manufacturer: varchar(255)
- totalSeats: int
- economySeats: int
- premiumSeats: int
- businessSeats: int
- manufactureDate: date
- status: enum ['active', 'maintenance', 'retired'] default 'active'
- createdAt: timestamp

#### 6. maintenance_logs

- id: serial PK
- aircraftId: bigint unsigned FK → aircraft.id
- maintenanceType: enum ['routine', 'repair', 'inspection']
- description: text
- scheduledDate: date
- completedDate: date (nullable)
- status: enum ['scheduled', 'in_progress', 'completed', 'cancelled']
- performedBy: bigint unsigned FK → users.id (nullable)
- notes: text
- createdAt: timestamp

#### 7. flights

- id: serial PK
- flightNumber: varchar(20) unique "VN123"
- routeId: bigint unsigned FK → routes.id
- aircraftId: bigint unsigned FK → aircraft.id
- scheduledDeparture: datetime
- scheduledArrival: datetime
- actualDeparture: datetime (nullable)
- actualArrival: datetime (nullable)
- status: enum ['scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled']
- gate: varchar(10) (nullable)
- terminal: varchar(10) (nullable)
- basePrice: decimal(10,2)
- economyPrice: decimal(10,2)
- premiumPrice: decimal(10,2)
- businessPrice: decimal(10,2)
- createdBy: bigint unsigned FK → users.id
- createdAt: timestamp
- updatedAt: timestamp

#### 8. seats

- id: serial PK
- aircraftId: bigint unsigned FK → aircraft.id
- seatNumber: varchar(10) "12A, 15F"
- seatClass: enum ['economy', 'premium', 'business']
- seatType: enum ['window', 'aisle', 'middle', 'exit_row']
- extraPrice: decimal(10,2) default 0
- seatMapRow: int
- seatMapCol: int
- createdAt: timestamp

#### 9. flight_seats

- id: serial PK
- flightId: bigint unsigned FK → flights.id
- seatId: bigint unsigned FK → seats.id
- status: enum ['available', 'occupied', 'blocked'] default 'available'
- bookedBy: bigint unsigned FK → users.id (nullable)
- bookingId: bigint unsigned FK → bookings.id (nullable)

#### 10. bookings

- id: serial PK
- bookingCode: varchar(20) unique "ABC123"
- userId: bigint unsigned FK → users.id
- flightId: bigint unsigned FK → flights.id
- tripType: enum ['one_way', 'round_trip'] default 'one_way'
- returnFlightId: bigint unsigned FK → flights.id (nullable)
- status: enum ['pending', 'confirmed', 'cancelled', 'completed'] default 'pending'
- totalAmount: decimal(12,2)
- paymentStatus: enum ['pending', 'paid', 'refunded', 'failed'] default 'pending'
- passengerDetails: json
- contactEmail: varchar(320)
- contactPhone: varchar(20)
- bookedAt: timestamp
- expiresAt: timestamp (booking hold 15 min)
- createdAt: timestamp

#### 11. tickets

- id: serial PK
- bookingId: bigint unsigned FK → bookings.id
- ticketNumber: varchar(30) unique
- passengerName: varchar(255)
- passengerType: enum ['adult', 'child', 'infant'] default 'adult'
- seatId: bigint unsigned FK → seats.id (nullable)
- flightSeatId: bigint unsigned FK → flight_seats.id (nullable)
- status: enum ['active', 'used', 'cancelled', 'refunded'] default 'active'
- createdAt: timestamp

#### 12. payments

- id: serial PK
- bookingId: bigint unsigned FK → bookings.id
- amount: decimal(12,2)
- method: enum ['credit_card', 'debit_card', 'momo', 'zalopay', 'qr_code']
- status: enum ['pending', 'success', 'failed', 'refunded']
- transactionId: varchar(255) unique
- paymentDetails: json (masked card info)
- paidAt: timestamp (nullable)
- createdAt: timestamp

#### 13. crew_members

- id: serial PK
- userId: bigint unsigned FK → users.id
- employeeCode: varchar(50) unique
- position: enum ['captain', 'first_officer', 'flight_attendant']
- licenseNumber: varchar(100)
- totalFlyingHours: int default 0
- status: enum ['active', 'inactive', 'on_leave']
- hiredDate: date

#### 14. flight_crew

- id: serial PK
- flightId: bigint unsigned FK → flights.id
- crewMemberId: bigint unsigned FK → crew_members.id
- roleOnFlight: enum ['captain', 'first_officer', 'lead_attendant', 'attendant']
- assignedAt: timestamp

#### 15. notifications

- id: serial PK
- userId: bigint unsigned FK → users.id
- type: enum ['booking_confirm', 'flight_delay', 'flight_cancel', 'reminder', 'promo']
- title: varchar(255)
- message: text
- isRead: boolean default false
- metadata: json
- createdAt: timestamp

### Relations (db/relations.ts)

- users ↔ user_profiles (1:1)
- users ↔ bookings (1:n)
- users ↔ notifications (1:n)
- airports ↔ routes.departureAirportId (1:n)
- airports ↔ routes.arrivalAirportId (1:n)
- routes ↔ flights (1:n)
- aircraft ↔ flights (1:n)
- aircraft ↔ seats (1:n)
- aircraft ↔ maintenance_logs (1:n)
- flights ↔ flight_seats (1:n)
- flights ↔ bookings (1:n)
- flights ↔ flight_crew (1:n)
- flights ↔ tickets (1:n via bookings)
- seats ↔ flight_seats (1:n)
- bookings ↔ tickets (1:n)
- bookings ↔ payments (1:n)
- users ↔ crew_members (1:1)
- crew_members ↔ flight_crew (1:n)

## API Endpoints (tRPC Routers)

### Public Routers

- **airport.list** - List all active airports
- **airport.search** - Search airports by code/city/name
- **airport.byId** - Get airport by ID
- **airport.byCode** - Get airport by code

- **flight.search** - Search flights by route, date, passengers, class
- **flight.byId** - Get flight details
- **flight.seatMap** - Get seat map for a flight

### Authenticated Routers

- **booking.create** - Create new booking (hold 15 min)
- **booking.byId** - Get booking details
- **booking.myBookings** - List user's bookings
- **booking.cancel** - Cancel booking
- **booking.selectSeats** - Select seats for booking

- **ticket.myTickets** - List user's tickets
- **ticket.byId** - Get ticket details

- **payment.create** - Create payment
- **payment.confirm** - Confirm payment success
- **payment.myPayments** - List user's payments

- **user.profile** - Get user profile
- **user.updateProfile** - Update user profile
- **user.notifications** - Get user notifications
- **user.markNotificationRead** - Mark notification as read

### Admin Routers

- **admin.stats** - Dashboard statistics
- **admin.revenueReport** - Revenue report data
- **admin.flightStats** - Flight occupancy stats

- **flightAdmin.list** - List all flights with filters
- **flightAdmin.create** - Create new flight
- **flightAdmin.update** - Update flight
- **flightAdmin.updateStatus** - Update flight status (delayed, cancelled, etc.)
- **flightAdmin.delete** - Delete flight

- **airportAdmin.list** - List all airports
- **airportAdmin.create** - Create airport
- **airportAdmin.update** - Update airport
- **airportAdmin.delete** - Delete airport

- **routeAdmin.list** - List all routes
- **routeAdmin.create** - Create route
- **routeAdmin.update** - Update route
- **routeAdmin.delete** - Delete route

- **aircraftAdmin.list** - List all aircraft
- **aircraftAdmin.create** - Create aircraft
- **aircraftAdmin.update** - Update aircraft
- **aircraftAdmin.updateStatus** - Update aircraft status

- **bookingAdmin.list** - List all bookings
- **bookingAdmin.updateStatus** - Update booking status
- **bookingAdmin.cancel** - Cancel any booking

- **crewAdmin.list** - List crew members
- **crewAdmin.create** - Create crew member
- **crewAdmin.update** - Update crew member
- **crewAdmin.assignFlight** - Assign crew to flight

- **maintenanceAdmin.list** - List maintenance logs
- **maintenanceAdmin.create** - Create maintenance log
- **maintenanceAdmin.update** - Update maintenance log

- **customer.list** - List all customers
- **customer.byId** - Get customer details

### Crew Routers (basic)

- **crew.mySchedule** - Get crew member's flight schedule
- **crew.myFlights** - Get upcoming flights for crew

## Pages

### Customer Portal

1. **Home** (`/`) - Hero, flight search form, featured destinations
2. **Search Results** (`/search`) - Flight search results with filters
3. **Flight Detail** (`/flights/:id`) - Flight details, seat map
4. **Booking** (`/booking/:flightId`) - Passenger info, seat selection, payment
5. **My Bookings** (`/my-bookings`) - List user's bookings
6. **Booking Detail** (`/bookings/:id`) - Booking details, ticket download
7. **Profile** (`/profile`) - User profile, saved documents
8. **Notifications** (`/notifications`) - User notifications

### Admin Portal

9. **Admin Dashboard** (`/admin`) - Stats cards, revenue charts, recent bookings
10. **Flights Management** (`/admin/flights`) - CRUD flights
11. **Airports Management** (`/admin/airports`) - CRUD airports
12. **Routes Management** (`/admin/routes`) - CRUD routes
13. **Aircraft Management** (`/admin/aircraft`) - CRUD aircraft
14. **Bookings Management** (`/admin/bookings`) - View/manage all bookings
15. **Customers Management** (`/admin/customers`) - View all customers
16. **Crew Management** (`/admin/crew`) - Manage crew members
17. **Maintenance Logs** (`/admin/maintenance`) - View/update maintenance
18. **Reports** (`/admin/reports`) - Revenue charts, occupancy stats

### Crew Portal (basic)

19. **Crew Schedule** (`/crew/schedule`) - Personal flight schedule

### Auth

20. **Login** (`/login`) - OAuth login

## i18n Strategy

- Use react-i18next with i18next-browser-languagedetector
- Default: Vietnamese (vi), fallback: English (en)
- Language switcher in header
- Translation files in `public/locales/{lang}/translation.json`
- All UI text via `t('key')`, never hardcoded
- Key convention: `page.section.element` (e.g., `home.search.title`)

## Simulated Payment

- Mock payment gateway - no real integration
- Payment methods: credit_card, debit_card, momo, zalopay, qr_code
- Process: create payment → simulate processing → confirm after 2s delay
- Store transaction ID as mock

## Auth Flow

- Kimi OAuth 2.0 login
- Role-based access: user/customer, admin
- Admin routes protected by adminQuery middleware
- Frontend route guards for /admin/_ and /crew/_

## Data Flow

1. Customer searches flights → publicQuery.flight.search
2. Selects flight + seats → authedQuery.booking.create
3. Enters passenger info → booking updated
4. Pays → authedQuery.payment.create → simulate → confirm
5. Booking confirmed → tickets generated → notifications sent
6. Admin manages via adminQuery.\* routers
