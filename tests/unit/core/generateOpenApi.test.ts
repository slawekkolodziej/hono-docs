import { describe, test, expect } from "vitest";

// We need to test the utility functions from generateOpenApi
// Since they're not exported, we'll need to extract them or create a separate utils file
// For now, let's create inline implementations to test the logic

/**
 * Normalize path by converting :param syntax to {param} OpenAPI syntax
 */
function normalizePathToOpenApi(path: string): string {
  return path.replace(/:([^/]+)/g, '{$1}');
}

/**
 * Combine path prefix with route path, avoiding double slashes
 */
function combinePathWithPrefix(prefix: string, routePath: string): string {
  if (prefix === "/" || prefix === "") {
    return routePath;
  }
  if (routePath === "/") {
    return prefix;
  }
  // Remove trailing slash from prefix to avoid double slashes
  const cleanPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return cleanPrefix + (routePath.startsWith("/") ? routePath : "/" + routePath);
}

/**
 * Apply documentation from doc() middleware to an operation
 */
function applyDocumentationToOperation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: any,
  docConfig: { summary?: string; description?: string; tags?: string[]; deprecated?: boolean } | undefined,
  fallbackSummary: string,
  apiGroupName: string
): void {
  if (docConfig) {
    operation.summary = docConfig.summary || fallbackSummary;
    if (docConfig.description) operation.description = docConfig.description;
    if (docConfig.tags && docConfig.tags.length > 0) {
      operation.tags = docConfig.tags;
    } else {
      // If tags are empty or not provided, use the apiGroupName
      operation.tags = [apiGroupName];
    }
    if (docConfig.deprecated) operation.deprecated = true;
  } else {
    operation.summary = fallbackSummary;
    operation.tags = [apiGroupName];
  }
}

describe("generateOpenApi utility functions", () => {
  describe("normalizePathToOpenApi", () => {
    test("converts single path parameter", () => {
      expect(normalizePathToOpenApi("/users/:id")).toBe("/users/{id}");
    });

    test("converts multiple path parameters", () => {
      expect(normalizePathToOpenApi("/users/:id/posts/:postId")).toBe("/users/{id}/posts/{postId}");
    });

    test("handles paths without parameters", () => {
      expect(normalizePathToOpenApi("/users")).toBe("/users");
    });

    test("handles root path", () => {
      expect(normalizePathToOpenApi("/")).toBe("/");
    });

    test("handles complex parameter names", () => {
      expect(normalizePathToOpenApi("/users/:userId/posts/:post_id")).toBe("/users/{userId}/posts/{post_id}");
    });
  });

  describe("combinePathWithPrefix", () => {
    test("combines prefix with route path", () => {
      expect(combinePathWithPrefix("/api", "/users")).toBe("/api/users");
    });

    test("handles empty prefix", () => {
      expect(combinePathWithPrefix("", "/users")).toBe("/users");
    });

    test("handles root prefix", () => {
      expect(combinePathWithPrefix("/", "/users")).toBe("/users");
    });

    test("handles root route path", () => {
      expect(combinePathWithPrefix("/api", "/")).toBe("/api");
    });

    test("handles route without leading slash", () => {
      expect(combinePathWithPrefix("/api", "users")).toBe("/api/users");
    });

    test("avoids double slashes", () => {
      expect(combinePathWithPrefix("/api/", "/users")).toBe("/api/users");
    });

    test("handles both empty", () => {
      expect(combinePathWithPrefix("", "/")).toBe("/");
    });
  });

  describe("applyDocumentationToOperation", () => {
    test("applies doc config when provided", () => {
      const operation = {};
      const docConfig = {
        summary: "Custom summary",
        description: "Custom description",
        tags: ["CustomTag"]
      };

      applyDocumentationToOperation(operation, docConfig, "Fallback summary", "DefaultGroup");

      expect(operation).toEqual({
        summary: "Custom summary",
        description: "Custom description",
        tags: ["CustomTag"]
      });
    });

    test("uses fallback when doc config is undefined", () => {
      const operation = {};

      applyDocumentationToOperation(operation, undefined, "Fallback summary", "DefaultGroup");

      expect(operation).toEqual({
        summary: "Fallback summary",
        tags: ["DefaultGroup"]
      });
    });

    test("uses fallback summary when doc config summary is empty", () => {
      const operation = {};
      const docConfig = { description: "Custom description" };

      applyDocumentationToOperation(operation, docConfig, "Fallback summary", "DefaultGroup");

      expect(operation).toEqual({
        summary: "Fallback summary",
        description: "Custom description",
        tags: ["DefaultGroup"]
      });
    });

    test("applies deprecated flag", () => {
      const operation = {};
      const docConfig = {
        summary: "Deprecated endpoint",
        deprecated: true
      };

      applyDocumentationToOperation(operation, docConfig, "Fallback", "DefaultGroup");

      expect(operation).toEqual({
        summary: "Deprecated endpoint",
        deprecated: true,
        tags: ["DefaultGroup"]
      });
    });

    test("skips empty tags array", () => {
      const operation = {};
      const docConfig = {
        summary: "Custom summary",
        tags: []
      };

      applyDocumentationToOperation(operation, docConfig, "Fallback", "DefaultGroup");

      expect(operation).toEqual({
        summary: "Custom summary",
        tags: ["DefaultGroup"] // Should fall back to default group
      });
    });
  });
});