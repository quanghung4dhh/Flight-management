import { vi } from "vitest";

// Mock getDb globally
vi.mock("../../api/queries/connection", async () => {
  return {
    getDb: vi.fn(),
  };
});
