// test/api/routers.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../../api/router";
import { getDb } from "../../api/queries/connection";
import { createMockDb } from "./mocks";

function makeCtx(user?: any) {
  return {
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
    user,
  };
}

describe("App Router - Schema Migration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ping", () => {
    it("returns ok and timestamp", async () => {
      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.ping();
      expect(result.ok).toBe(true);
      expect(typeof result.ts).toBe("number");
    });
  });

  describe("airport", () => {
    it("list returns airports ordered by iataCode", async () => {
      const mockAirports = [
        { airportID: "AP-SGN", iataCode: "SGN", city: "Ho Chi Minh City", country: "Vietnam" },
        { airportID: "AP-HAN", iataCode: "HAN", city: "Hanoi", country: "Vietnam" },
      ];
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: mockAirports }) as any);

      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.airport.list();
      expect(result).toEqual(mockAirports);
    });

    it("search filters by iataCode, city, airportID", async () => {
      const mockAirports = [
        { airportID: "AP-SGN", iataCode: "SGN", city: "Ho Chi Minh City", country: "Vietnam" },
      ];
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: mockAirports }) as any);

      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.airport.search({ query: "SGN" });
      expect(result).toEqual(mockAirports);
    });

    it("byId returns single airport", async () => {
      const mockAirport = { airportID: "AP-SGN", iataCode: "SGN", city: "Ho Chi Minh City", country: "Vietnam" };
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: [mockAirport] }) as any);

      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.airport.byId({ id: "AP-SGN" });
      expect(result).toEqual(mockAirport);
    });

    it("byCode returns airport by iataCode", async () => {
      const mockAirport = { airportID: "AP-SGN", iataCode: "SGN", city: "Ho Chi Minh City", country: "Vietnam" };
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: [mockAirport] }) as any);

      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.airport.byCode({ code: "SGN" });
      expect(result).toEqual(mockAirport);
    });
  });

  describe("flight", () => {
    it("search returns flights with pricing", async () => {
      const mockRoute = { routeID: "RT-001", departureAirportID: "AP-SGN", arrivalAirportID: "AP-HAN", distance: 1060, duration: 135 };
      const mockFlight = { flightID: "FL-001", routeID: "RT-001", aircraftID: "AC-001", scheduledDeparture: new Date(), scheduledArrival: new Date(), status: "scheduled" };
      const mockPricing = { pricingID: "PR-001", flightID: "FL-001", seatClassID: "ECO", basePrice: "1500" };

      let callCount = 0;
      vi.mocked(getDb).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return createMockDb({ limit: [mockRoute] }) as any;
        if (callCount === 2) return createMockDb({ limit: [mockFlight] }) as any;
        return createMockDb({ limit: [mockPricing] }) as any;
      });

      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.flight.search({
        departureAirportId: "AP-SGN",
        arrivalAirportId: "AP-HAN",
        departureDate: "2026-06-20",
        seatClass: "ECO",
        passengers: 1,
      });

      expect(result.route).toBeDefined();
      expect(Array.isArray(result.flights)).toBe(true);
    });

    it("byId returns flight", async () => {
      const mockFlight = { flightID: "FL-001", routeID: "RT-001", aircraftID: "AC-001", scheduledDeparture: new Date(), scheduledArrival: new Date(), status: "scheduled" };
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: [mockFlight] }) as any);

      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.flight.byId({ id: "FL-001" });
      expect(result?.flightID).toBe("FL-001");
    });
  });

  describe("auth", () => {
    it("me returns current user from context", async () => {
      const mockUser = { accountID: "ACC-001", username: "testuser", role: "customer", status: "active", password: "hashed", createdAt: new Date(), updatedAt: new Date() };
      const caller = appRouter.createCaller(makeCtx(mockUser));
      const result = await caller.auth.me();
      expect(result.accountID).toBe("ACC-001");
      expect(result.username).toBe("testuser");
    });
  });

  describe("booking", () => {
    it("myBookings returns user bookings", async () => {
      const mockBookings = [
        { bookingID: "BK-001", customerID: "ACC-001", bookDate: new Date(), totalAmount: "3000", status: "pending", createdAt: new Date(), updatedAt: new Date() },
      ];
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: mockBookings }) as any);

      const mockUser = { accountID: "ACC-001", username: "testuser", role: "customer", status: "active", password: "hashed", createdAt: new Date(), updatedAt: new Date() };
      const caller = appRouter.createCaller(makeCtx(mockUser));
      const result = await caller.booking.myBookings();
      expect(result.length).toBe(1);
      expect(result[0].bookingID).toBe("BK-001");
    });
  });

  describe("payment", () => {
    it("myPayments returns user payments", async () => {
      const mockPayments = [
        { paymentID: "PM-001", transactionID: "TXN-001", bookingID: "BK-001", payDate: new Date(), status: "paid", method: "credit_card", createdAt: new Date(), updatedAt: new Date() },
      ];
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: mockPayments }) as any);

      const mockUser = { accountID: "ACC-001", username: "testuser", role: "customer", status: "active", password: "hashed", createdAt: new Date(), updatedAt: new Date() };
      const caller = appRouter.createCaller(makeCtx(mockUser));
      const result = await caller.payment.myPayments();
      expect(result.length).toBe(1);
    });
  });

  describe("admin", () => {
    it("stats returns counts", async () => {
      const mockCounts = [{ count: 10 }];
      vi.mocked(getDb).mockReturnValue(createMockDb({ limit: mockCounts }) as any);

      const mockAdmin = { accountID: "ADM-001", username: "admin", role: "admin", status: "active", password: "hashed", createdAt: new Date(), updatedAt: new Date() };
      const caller = appRouter.createCaller(makeCtx(mockAdmin));
      const result = await caller.admin.stats();
      expect(result.totalFlights).toBe(10);
    });
  });
});