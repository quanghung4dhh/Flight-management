import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, userProfiles, notifications } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const userRouter = createRouter({
  profile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      with: {
        profile: true,
      },
    });
    return user;
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        idCardNumber: z.string().optional(),
        passportNumber: z.string().optional(),
        dateOfBirth: z.string().optional(),
        nationality: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Update user name and phone
      if (input.name || input.phone) {
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.phone) updateData.phone = input.phone;
        await db.update(users).set(updateData).where(eq(users.id, userId));
      }

      // Upsert user profile
      const existingProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId),
      });

      const profileData: any = {
        idCardNumber: input.idCardNumber || null,
        passportNumber: input.passportNumber || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        nationality: input.nationality || null,
      };

      if (existingProfile) {
        await db
          .update(userProfiles)
          .set(profileData)
          .where(eq(userProfiles.userId, userId));
      } else {
        await db.insert(userProfiles).values({ userId, ...profileData });
      }

      return { success: true };
    }),

  notifications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.user.id),
      orderBy: desc(notifications.createdAt),
      limit: 50,
    });
  }),

  markNotificationRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
