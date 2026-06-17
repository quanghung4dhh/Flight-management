import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { airports } from "@db/schema";
import { eq, like, or, and } from "drizzle-orm";

export const airportRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.query.airports.findMany({
      where: eq(airports.status, "active"),
      orderBy: airports.code,
    });
  }),

  search: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      return db.query.airports.findMany({
        where: and(
          eq(airports.status, "active"),
          or(
            like(airports.code, searchTerm),
            like(airports.city, searchTerm),
            like(airports.name, searchTerm)
          )
        ),
        limit: 10,
      });
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.airports.findFirst({
        where: eq(airports.id, input.id),
      });
    }),

  byCode: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.airports.findFirst({
        where: eq(airports.code, input.code),
      });
    }),
});
