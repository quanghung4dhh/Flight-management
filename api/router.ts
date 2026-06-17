import { authRouter } from "./auth-router";
import { airportRouter } from "./airportRouter";
import { flightRouter } from "./flightRouter";
import { bookingRouter } from "./bookingRouter";
import { paymentRouter } from "./paymentRouter";
import { userRouter } from "./userRouter";
import { adminRouter } from "./adminRouter";
import { seedRouter } from "./seedRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  airport: airportRouter,
  flight: flightRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  user: userRouter,
  admin: adminRouter,
  seed: seedRouter,
});

export type AppRouter = typeof appRouter;
