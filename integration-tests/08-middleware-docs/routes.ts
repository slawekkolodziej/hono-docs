import { Hono } from "hono";
import { doc } from "../../dist/index.js";

const app = new Hono()
  .get(
    "/health",
    doc({
      summary: "Health check endpoint",
      description: "Returns the current status of the API service",
      tags: ["Health", "Monitoring"]
    }),
    (c) => c.json({ status: "ok", timestamp: new Date() })
  )
  
  .get(
    "/users",
    doc({
      summary: "List all users",
      description: "Retrieve a paginated list of users with optional filtering",
      tags: ["Users"]
    }),
    (c) => c.json({ users: [], total: 0 })
  )
  
  .get(
    "/users/:id",
    doc({
      summary: "Get user by ID",  
      description: "Retrieve detailed information about a specific user by their unique ID",
      tags: ["Users"]
    }),
    (c) => c.json({ 
      id: c.req.param("id"), 
      name: "John Doe",
      email: "john@example.com" 
    })
  )
  
  .post(
    "/users",
    doc({
      summary: "Create new user",
      description: "Create a new user account with the provided data",
      tags: ["Users", "Admin"]
    }),
    (c) => c.json({ id: "123", message: "User created" })
  )
  
  .get(
    "/legacy",
    doc({
      summary: "Legacy endpoint",
      description: "This endpoint is deprecated and will be removed in v2.0",
      tags: ["Legacy"],
      deprecated: true
    }),
    (c) => c.json({ message: "This endpoint is deprecated" })
  );

export type AppType = typeof app;