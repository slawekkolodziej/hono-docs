import { Hono } from "hono";

const app = new Hono()
  /**
   * @summary Get system health status
   * @description Returns the current health status of the system including uptime and service status
   * @tags Health, System
   * @deprecated false
   */
  .get("/health", (c) => c.json({ status: "ok" }))
  
  /**
   * @summary List all users
   * @description Retrieve a paginated list of all users in the system with optional filtering
   * @tags Users, Admin
   */
  .get("/users", (c) => c.json({ users: [] }))
  
  /**
   * @summary Get user by ID
   * @description Get detailed information about a specific user
   * @tags Users
   */
  .get("/users/:id", (c) => c.json({ userId: c.req.param("id") }))
  
  /**
   * @summary Create new user
   * @description Create a new user account in the system
   * @tags Users, Admin
   */
  .post("/users", (c) => c.json({ created: true }))
  
  /**
   * @summary Delete user
   * @description Remove a user from the system (this endpoint is deprecated)
   * @tags Users, Admin
   * @deprecated true
   */
  .delete("/users/:id", (c) => c.json({ deleted: true }));

export type AppType = typeof app;