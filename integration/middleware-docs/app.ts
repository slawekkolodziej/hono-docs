import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { doc, serveOpenAPI } from "hono-docs";
import config from './hono-docs.config';
import {
  createdUserResponse,
  legacyResponse,
  userDetailResponse,
  userListResponse,
} from "./schemas";

const app = new Hono()
  .get(
    "/health",
    doc({
      summary: "Health check endpoint",
      description: `
        Returns the current status of the API service
        Sometimes can return something else :D

        - list item 1
        - list item 2
      `,
      tags: ["Health", "Monitoring"],
    }),
    (c) => c.json({ status: "ok", timestamp: new Date() })
  )
  .get(
    "/users",
    doc({
      summary: "List all users",
      description: "Retrieve a paginated list of users with optional filtering",
      tags: ["Users"],
    }),
    (c) => c.json(userListResponse)
  )
  .get(
    "/users/:id",
    doc({
      summary: "Get user by ID",
      description: `
        # Retrieve detailed information about a specific user by their unique ID
      `,
      tags: ["Users"],
    }),
    (c) => c.json(userDetailResponse(c.req.param("id")))
  )
  .post(
    "/users",
    doc({
      summary: "Create new user",
      description: "Create a new user account with the provided data",
      tags: ["Users", "Admin"],
    }),
    (c) => c.json(createdUserResponse)
  )
  .get(
    "/legacy",
    doc({
      summary: "Legacy endpoint",
      description: "This endpoint is deprecated and will be removed in v2.0",
      tags: ["Legacy"],
      deprecated: true,
    }),
    (c) => c.json(legacyResponse)
  )
  .get(
    "/docs",
    Scalar({
      url: "/openapi.json",
      theme: "kepler",
      layout: "modern",
      defaultHttpClient: { targetKey: "js", clientKey: "axios" },
    })
  )
  .get("/openapi.json", serveOpenAPI({ config }));

export type AppType = typeof app;
export default app;
