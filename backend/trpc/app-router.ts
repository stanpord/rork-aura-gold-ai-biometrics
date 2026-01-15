import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { crmRouter } from "./routes/crm";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  crm: crmRouter,
});

export type AppRouter = typeof appRouter;
