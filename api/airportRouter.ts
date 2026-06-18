import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { airports } from "@db/schema";
import { eq, like, or } from "drizzle-orm";

export const airportRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(airports).orderBy(airports.iataCode);
  }),

  search: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      return db
        .select()
        .from(airports)
        .where(
          or(
            like(airports.iataCode, searchTerm),
            like(airports.city, searchTerm),
            like(airports.airportID, searchTerm)
          )
        )
        .limit(10);
    }),

  byId: publicQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(airports)
        .where(eq(airports.airportID, input.id))
        .limit(1);
      return result[0] || null;
    }),

  byCode: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, input.code))
        .limit(1);
      return result[0] || null;
    }),
});
