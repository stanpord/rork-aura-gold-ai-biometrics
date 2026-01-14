import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { crmRouter } from "./routes/crm";
import { leadsRouter } from "./routes/leads";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  crm: crmRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
