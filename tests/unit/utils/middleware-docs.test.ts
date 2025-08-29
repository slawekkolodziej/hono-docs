// Tests for doc() middleware extraction
import { describe, test, expect, beforeEach } from "vitest";
import { Project } from "ts-morph";
import {
  extractDocumentationFromMiddleware,
  createDocLookup,
} from "../../../src/utils/middleware-docs";

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
        tags: ["Health"],
      },
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
    const sortedDocs = documentation.sort((a, b) =>
      `${a.method}:${a.route}`.localeCompare(`${b.method}:${b.route}`)
    );

    // Test GET /legacy
    expect(sortedDocs[0]).toEqual({
      method: "get",
      route: "/legacy",
      docConfig: {
        summary: "Legacy endpoint",
        deprecated: true,
      },
    });

    // Test GET /users
    expect(sortedDocs[1]).toEqual({
      method: "get",
      route: "/users",
      docConfig: {
        summary: "List users",
        tags: ["Users"],
      },
    });

    // Test POST /users
    expect(sortedDocs[2]).toEqual({
      method: "post",
      route: "/users",
      docConfig: {
        summary: "Create user",
        description: "Creates a new user account",
        tags: ["Users", "Admin"],
      },
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
        summary: "Documented route",
      },
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
      "Tag1",
      "Tag2",
      "Long Tag Name",
      "Special-Chars_123",
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
    const sortedDocs = documentation.sort((a, b) =>
      a.method.localeCompare(b.method)
    );
    expect(sortedDocs.map((d) => d.method)).toEqual([
      "delete",
      "get",
      "patch",
      "post",
      "put",
    ]);
    expect(sortedDocs.map((d) => d.docConfig.summary)).toEqual([
      "DELETE route",
      "GET route",
      "PATCH route",
      "POST route",
      "PUT route",
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
    const sortedDocs = documentation.sort((a, b) =>
      a.route.localeCompare(b.route)
    );
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
        summary: "Protected route",
      },
    });
  });

  test("creates lookup map correctly", () => {
    const documentation = [
      {
        method: "get",
        route: "/users",
        docConfig: { summary: "List users" },
      },
      {
        method: "post",
        route: "/users",
        docConfig: { summary: "Create user" },
      },
      {
        method: "get",
        route: "/users/:id",
        docConfig: { summary: "Get user" },
      },
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
    const sortedDocs = documentation.sort((a, b) =>
      a.route.localeCompare(b.route)
    );
    expect(sortedDocs[0].docConfig.deprecated).toBe(false); // /deprecated-false
    expect(sortedDocs[1].docConfig.deprecated).toBe(true); // /deprecated-true
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

  test("handles template literal descriptions with dedent preprocessing", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/multiline-desc",
          doc({
            summary: "Template literal summary",
            description: \`
              This is a multiline description
              that should have its leading whitespace
              automatically removed by dedent preprocessing.
              
              It can contain multiple paragraphs
              and preserve relative indentation.
            \`
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig.summary).toBe("Template literal summary");
    expect(documentation[0].docConfig.description).toBe(
      [
        "This is a multiline description",
        "that should have its leading whitespace",
        "automatically removed by dedent preprocessing.",
        "",
        "It can contain multiple paragraphs",
        "and preserve relative indentation.",
      ].join("\n")
    );
  });

  test("handles template literal summaries with dedent preprocessing", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/multiline-summary",
          doc({
            summary: \`
              A multiline summary
              with dedent preprocessing
            \`,
            description: "Single line description"
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig.summary).toBe(
      ["A multiline summary", "with dedent preprocessing"].join("\n")
    );
    expect(documentation[0].docConfig.description).toBe(
      "Single line description"
    );
  });

  test("handles descriptions with markdown content", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/markdown-desc",
          doc({
            summary: "Endpoint with markdown description",
            description: \`
              ## Overview
              This endpoint **supports** markdown formatting.
              
              ### Features
              - *Italic text*
              - **Bold text**  
              - Links: [example](https://example.com)
              
              > **Note**: This description uses markdown syntax
            \`
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig.summary).toBe(
      "Endpoint with markdown description"
    );
    expect(documentation[0].docConfig.description).toContain("## Overview");
    expect(documentation[0].docConfig.description).toContain("**supports**");
    expect(documentation[0].docConfig.description).toContain("### Features");
    expect(documentation[0].docConfig.description).toContain("- *Italic text*");
    expect(documentation[0].docConfig.description).toContain("[example]");
    expect(documentation[0].docConfig.description).toContain("> **Note**:");
  });

  test("handles complex indented content with proper dedent", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/complex-dedent",
          doc({
            summary: "Complex dedent example",
            description: \`
                  Level 1 content
                    Level 2 indented content
                      Level 3 deeply indented
                    Back to level 2
                  Back to level 1
                  
                  Normal paragraph with no extra indentation.
            \`
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(1);
    expect(documentation[0].docConfig.description).toBe(
      [
        "Level 1 content",
        "  Level 2 indented content",
        "    Level 3 deeply indented",
        "  Back to level 2",
        "Back to level 1",
        "",
        "Normal paragraph with no extra indentation."
      ].join("\n")
    );
  });

  test("handles empty template literals correctly", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/empty-template",
          doc({
            summary: \`\`,
            description: \`
              
            \`
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    // Should not extract configurations with only empty strings
    expect(documentation).toHaveLength(0);
  });

  test("handles mixed string literals and template literals", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/mixed-strings",
          doc({
            summary: "Regular string literal",
            description: \`
              Template literal description
              with multiple lines
            \`
          }),
          (c) => c.json({})
        )
        .post(
          "/mixed-reverse",
          doc({
            summary: \`
              Template literal summary
              with multiple lines
            \`,
            description: "Regular string literal description"
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(2);

    const sortedDocs = documentation.sort((a, b) =>
      a.method.localeCompare(b.method)
    );

    // GET /mixed-strings
    expect(sortedDocs[0]).toEqual({
      method: "get",
      route: "/mixed-strings",
      docConfig: {
        summary: "Regular string literal",
        description: ["Template literal description", "with multiple lines"].join("\n"),
      },
    });

    // POST /mixed-reverse
    expect(sortedDocs[1]).toEqual({
      method: "post",
      route: "/mixed-reverse",
      docConfig: {
        summary: ["Template literal summary", "with multiple lines"].join("\n"),
        description: "Regular string literal description",
      },
    });
  });

  test("comprehensive coverage of summary and description features", () => {
    const sourceCode = `
      import { Hono } from "hono";
      import { doc } from "@rcmade/hono-docs";

      const app = new Hono()
        .get(
          "/string-literals",
          doc({
            summary: "Simple string summary",
            description: "Simple string description"
          }),
          (c) => c.json({})
        )
        .post(
          "/template-literals", 
          doc({
            summary: \`
              Multi-line template summary
              with preserved formatting
            \`,
            description: \`
              ## Comprehensive Description
              
              This description demonstrates:
              1. **Bold text** formatting
              2. *Italic text* formatting  
              3. Lists and numbering
              
              ### Code Examples
              Use the endpoint like this:
              
              ### Important Notes
              > This is a blockquote with **bold** text
              
              The description supports full markdown.
            \`
          }),
          (c) => c.json({})
        )
        .put(
          "/mixed",
          doc({
            summary: "String literal summary", 
            description: \`
              Template literal description
              with automatic dedent processing
            \`,
            tags: ["Mixed", "Testing"],
            deprecated: false
          }),
          (c) => c.json({})
        );
    `;

    const sourceFile = project.createSourceFile("test.ts", sourceCode);
    const documentation = extractDocumentationFromMiddleware(sourceFile);

    expect(documentation).toHaveLength(3);

    const lookup = createDocLookup(documentation);

    // Test string literals
    const stringLiterals = lookup.get("get:/string-literals");
    expect(stringLiterals).toEqual({
      summary: "Simple string summary",
      description: "Simple string description",
    });

    // Test template literals with dedent
    const templateLiterals = lookup.get("post:/template-literals");
    expect(templateLiterals?.summary).toBe(
      ["Multi-line template summary", "with preserved formatting"].join("\n")
    );
    expect(templateLiterals?.description).toContain(
      "## Comprehensive Description"
    );
    expect(templateLiterals?.description).toContain("**Bold text**");
    expect(templateLiterals?.description).toContain("*Italic text*");
    expect(templateLiterals?.description).toContain("> This is a blockquote");
    expect(templateLiterals?.description).toContain("### Important Notes");

    // Test mixed types
    const mixed = lookup.get("put:/mixed");
    expect(mixed?.summary).toBe("String literal summary");
    expect(mixed?.description).toBe(
      ["Template literal description", "with automatic dedent processing"].join("\n")
    );
    expect(mixed?.tags).toEqual(["Mixed", "Testing"]);
    expect(mixed?.deprecated).toBe(false);
  });
});
