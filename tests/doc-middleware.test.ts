// Tests for doc() middleware extraction
import { describe, test, expect, beforeEach } from "vitest";
import { Project } from "ts-morph";
import { extractDocumentationFromMiddleware, createDocLookup } from "../src/utils/middleware-docs";

describe("doc() middleware extraction", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
  });

  test("extracts basic doc() middleware configuration", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/health",
          doc({
            summary: "Health check",
            description: "Returns system status",
            tags: ["Health"]
          }),
          (c) => c.json({ status: "ok" })
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0]).toEqual({
      method: "get",
      route: "/health",
      docConfig: {
        summary: "Health check",
        description: "Returns system status",
        tags: ["Health"]
      }
    });
  });

  test("extracts multiple routes with doc() middleware", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/users",
          doc({
            summary: "List users",
            tags: ["Users"]
          }),
          (c) => c.json([])
        )
        .post(
          "/users",
          doc({
            summary: "Create user",
            description: "Creates a new user account",
            tags: ["Users", "Admin"]
          }),
          (c) => c.json({ id: "123" })
        )
        .get(
          "/legacy",
          doc({
            summary: "Legacy endpoint",
            deprecated: true
          }),
          (c) => c.json({ message: "deprecated" })
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(3);
    
    // Sort by method and route for predictable testing
    const sortedDocs = documentation.sort((a, b) => `${a.method}:${a.route}`.localeCompare(`${b.method}:${b.route}`));
    
    // Test GET /legacy
    expect(sortedDocs[0]).toEqual({
      method: "get",
      route: "/legacy", 
      docConfig: {
        summary: "Legacy endpoint",
        deprecated: true
      }
    });

    // Test GET /users
    expect(sortedDocs[1]).toEqual({
      method: "get",
      route: "/users",
      docConfig: {
        summary: "List users",
        tags: ["Users"]
      }
    });

    // Test POST /users
    expect(sortedDocs[2]).toEqual({
      method: "post", 
      route: "/users",
      docConfig: {
        summary: "Create user",
        description: "Creates a new user account",
        tags: ["Users", "Admin"]
      }
    });
  });

  test("handles routes without doc() middleware", () => {
    const sourceCode = `
      import { Hono } from "hono";

      const app = new Hono()
        .get("/health", (c) => c.json({ status: "ok" }))
        .post("/users", (c) => c.json({ created: true }));
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(0);
  });

  test("handles mixed routes (some with doc, some without)", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get("/health", (c) => c.json({ status: "ok" }))
        .get(
          "/documented", 
          doc({ summary: "Documented route" }),
          (c) => c.json({})
        )
        .post("/undocumented", (c) => c.json({}));
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0]).toEqual({
      method: "get",
      route: "/documented",
      docConfig: {
        summary: "Documented route"
      }
    });
  });

  test("handles complex tag arrays", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/complex",
          doc({
            summary: "Complex route",
            tags: ["Tag1", "Tag2", "Long Tag Name", "Special-Chars_123"]
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig.tags).toEqual([
      "Tag1", "Tag2", "Long Tag Name", "Special-Chars_123"
    ]);
  });

  test("handles different HTTP methods", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get("/get", doc({ summary: "GET route" }), (c) => c.json({}))
        .post("/post", doc({ summary: "POST route" }), (c) => c.json({}))
        .put("/put", doc({ summary: "PUT route" }), (c) => c.json({}))
        .patch("/patch", doc({ summary: "PATCH route" }), (c) => c.json({}))
        .delete("/delete", doc({ summary: "DELETE route" }), (c) => c.json({}));
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(5);
    
    // Sort for predictable testing
    const sortedDocs = documentation.sort((a, b) => a.method.localeCompare(b.method));
    expect(sortedDocs.map(d => d.method)).toEqual([
      "delete", "get", "patch", "post", "put"
    ]);
    expect(sortedDocs.map(d => d.docConfig.summary)).toEqual([
      "DELETE route", "GET route", "PATCH route", "POST route", "PUT route"
    ]);
  });

  test("handles parameter routes", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/users/:id",
          doc({ summary: "Get user by ID" }),
          (c) => c.json({})
        )
        .get(
          "/posts/:postId/comments/:commentId",
          doc({ summary: "Get comment" }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(2);
    
    // Sort by route for predictable testing
    const sortedDocs = documentation.sort((a, b) => a.route.localeCompare(b.route));
    expect(sortedDocs[0].route).toBe("/posts/:postId/comments/:commentId");
    expect(sortedDocs[1].route).toBe("/users/:id");
  });

  test("handles doc() middleware with additional middleware", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/protected",
          doc({ summary: "Protected route" }),
          authMiddleware,
          rateLimitMiddleware,
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0]).toEqual({
      method: "get",
      route: "/protected",
      docConfig: {
        summary: "Protected route"
      }
    });
  });

  test("creates lookup map correctly", () => {
    const documentation = [
      {
        method: "get",
        route: "/users",
        docConfig: { summary: "List users" }
      },
      {
        method: "post", 
        route: "/users",
        docConfig: { summary: "Create user" }
      },
      {
        method: "get",
        route: "/users/:id", 
        docConfig: { summary: "Get user" }
      }
    ];

    const lookup = createDocLookup(documentation);

    expect(lookup.get("get:/users")).toEqual({ summary: "List users" });
    expect(lookup.get("post:/users")).toEqual({ summary: "Create user" });
    expect(lookup.get("get:/users/:id")).toEqual({ summary: "Get user" });
    expect(lookup.get("delete:/users")).toBeUndefined();
  });

  test("handles empty or malformed configurations gracefully", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/empty",
          doc({}),
          (c) => c.json({})
        )
        .get(
          "/minimal",
          doc({ summary: "" }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    // Should not extract configurations without useful information
    expect(documentation).toHaveLength(0);
  });

  test("handles boolean values correctly", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/deprecated-true",
          doc({
            summary: "Deprecated endpoint",
            deprecated: true
          }),
          (c) => c.json({})
        )
        .get(
          "/deprecated-false",
          doc({
            summary: "Not deprecated",
            deprecated: false
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(2);
    
    // Sort by route for predictable testing
    const sortedDocs = documentation.sort((a, b) => a.route.localeCompare(b.route));
    expect(sortedDocs[0].docConfig.deprecated).toBe(false); // /deprecated-false
    expect(sortedDocs[1].docConfig.deprecated).toBe(true);  // /deprecated-true
  });

  test("handles syntax errors gracefully", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        // This is malformed but should not crash the extraction
        .get(
          "/malformed"
          doc({ summary: "Missing comma" })
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    
    // Should not throw an error, just return empty results
    expect(() => {
      const documentation = extractDocumentationFromMiddleware(sourceFile);
      expect(documentation).toHaveLength(0);
    }).not.toThrow();
  });
});