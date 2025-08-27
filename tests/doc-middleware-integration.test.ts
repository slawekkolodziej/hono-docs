// Integration tests for doc() middleware with full OpenAPI generation
import { describe, test, expect, beforeEach } from "vitest";
import { Project } from "ts-morph";
import { extractDocumentationFromMiddleware, createDocLookup } from "../src/utils/middleware-docs";

describe("doc() middleware integration tests", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
  });

  test("works with real Hono chaining patterns", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const userRoutes = new Hono()
        .get(
          "/",
          doc({ summary: "List users", tags: ["Users"] }),
          (c) => c.json([])
        )
        .post(
          "/",
          doc({ summary: "Create user", tags: ["Users"] }),
          (c) => c.json({})
        );

      const app = new Hono()
        .get(
          "/health",
          doc({ summary: "Health check", tags: ["System"] }),
          (c) => c.json({ status: "ok" })
        )
        .route("/users", userRoutes);
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(3);
    
    const lookup = createDocLookup(documentation);
    expect(lookup.get("get:/health")).toEqual({
      summary: "Health check",
      tags: ["System"]
    });
    expect(lookup.get("get:/")).toEqual({
      summary: "List users", 
      tags: ["Users"]
    });
    expect(lookup.get("post:/")).toEqual({
      summary: "Create user",
      tags: ["Users"]
    });
  });

  test("limitations: does not handle middleware stored in variables", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const authDoc = doc({
        summary: "Authentication endpoint",
        tags: ["Auth"]
      });

      const app = new Hono()
        .post("/login", authDoc, (c) => c.json({}));
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    // Current limitation: cannot extract doc() middleware stored in variables
    // This is acceptable as the inline usage is the primary pattern
    expect(documentation).toHaveLength(0);
  });

  test("handles nested routes with prefixes", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const adminRoutes = new Hono()
        .get(
          "/users",
          doc({ summary: "Admin user list", tags: ["Admin", "Users"] }),
          (c) => c.json([])
        );

      const apiV1 = new Hono()
        .get(
          "/health",
          doc({ summary: "API health", tags: ["System"] }),
          (c) => c.json({ status: "ok" })
        )
        .route("/admin", adminRoutes);

      const app = new Hono()
        .route("/api/v1", apiV1);
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(2);
    
    const sortedDocs = documentation.sort((a, b) => a.route.localeCompare(b.route));
    expect(sortedDocs[0].route).toBe("/health");
    expect(sortedDocs[1].route).toBe("/users");
  });

  test("handles multiline configurations", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/complex",
          doc({
            summary: "Complex endpoint with long configuration",
            description: "This endpoint has a very detailed description that spans multiple lines and explains exactly what it does in great detail.",
            tags: [
              "Complex",
              "Multi-line",
              "Detailed"
            ],
            deprecated: false
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig).toEqual({
      summary: "Complex endpoint with long configuration",
      description: "This endpoint has a very detailed description that spans multiple lines and explains exactly what it does in great detail.",
      tags: ["Complex", "Multi-line", "Detailed"],
      deprecated: false
    });
  });

  test("handles basic special characters and Unicode", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/special",
          doc({
            description: "Unicode: 测试 🚀 café naïve résumé",
            tags: ["Special-Chars_123", "Unicode🌟", "Symbols@#$"]
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig.description).toBe("Unicode: 测试 🚀 café naïve résumé");
    expect(documentation[0].docConfig.tags).toEqual(["Special-Chars_123", "Unicode🌟", "Symbols@#$"]);
  });

  test("ignores non-HTTP methods", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .use(
          "/middleware", 
          doc({ summary: "Should be ignored" }),
          (c, next) => next()
        )
        .all(
          "/all", 
          doc({ summary: "Should be ignored" }),
          (c) => c.json({})
        )
        .get(
          "/valid",
          doc({ summary: "Should be extracted" }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].route).toBe("/valid");
    expect(documentation[0].method).toBe("get");
  });
});