import { Hono } from "hono";

const app = new Hono()
  /**
   * @summary Health check endpoint
   * @description Returns the current status of the API service
   * @tags Health, Monitoring
   */
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date() }))
  
  /**
   * @summary List all users
   * @description Retrieve a paginated list of users with optional filtering
   * @tags Users
   */
  .get("/users", (c) => c.json({ users: [], total: 0 }))
  
  /**
   * @summary Get user by ID  
   * @description Retrieve detailed information about a specific user by their unique ID
   * @tags Users
   */
  .get("/users/:id", (c) => c.json({ 
    id: c.req.param("id"), 
    name: "John Doe",
    email: "john@example.com" 
  }))
  
  /**
   * @summary Create new user
   * @description Create a new user account with the provided data
   * @tags Users, Admin
   */
  .post("/users", (c) => c.json({ id: "123", message: "User created" }))
  
  /**
   * @summary Legacy endpoint
   * @description This endpoint is deprecated and will be removed in v2.0
   * @tags Legacy
   * @deprecated true
   */
  .get("/legacy", (c) => c.json({ message: "This endpoint is deprecated" }));

export type AppType = typeof app;