import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authRoutes } from "./routes/userRoutes.js";

const app = new Hono()
  .get("/", (c) => {
    return c.text("Hello Hono!");
  })
  .route("/user", authRoutes);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
