import { vi } from "vitest";

export function createMockDb(overrides: any = {}) {
  const chainable = {
    limit: vi.fn((n: number) => Promise.resolve(overrides.limit ?? [])),
    offset: vi.fn((n: number) => chainable),
    orderBy: vi.fn(() => chainable),
    where: vi.fn(() => chainable),
    innerJoin: vi.fn(() => chainable),
    groupBy: vi.fn(() => chainable),
    from: vi.fn(() => chainable),
    then: vi.fn((cb: any) => Promise.resolve(overrides.limit ?? []).then(cb)),
  };

  return {
    select: vi.fn(() => chainable),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve(overrides.insert ?? [])),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(overrides.update ?? [])),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(overrides.delete ?? [])),
    })),
    transaction: vi.fn(async (fn: any) => fn(createMockDb(overrides))),
    ...overrides,
  };
}
