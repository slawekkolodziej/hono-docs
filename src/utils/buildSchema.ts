import { SyntaxKind } from "ts-morph";
import createDebug from "debug";

const debug = createDebug("hono-docs:buildSchema");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSchema(type: import("ts-morph").Type): any {
  // Handle union types
  if (type.isUnion()) {
    const members = type.getUnionTypes();
    const lits = members.filter((u) => u.isStringLiteral());
    const onlyNull = members.every(
      (u) => u.isStringLiteral() || u.isNull() || u.isUndefined()
    );
    if (lits.length && onlyNull) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema: any = {
        type: "string",
        enum: lits.map((u) => u.getLiteralValue()),
      };
      if (members.some((u) => u.isNull() || u.isUndefined()))
        schema.nullable = true;
      return schema;
    }
    const nonNull = members.filter((u) => !u.isNull() && !u.isUndefined());
    return { oneOf: nonNull.map(buildSchema) };
  }
  
  // Handle intersection types (common with validator error responses)
  if (type.isIntersection()) {
    const typeText = type.getText();
    debug("Processing intersection type: %s", typeText.substring(0, 200));
    
    // Check for validation errors by structure
    // Valibot: has 'typed', 'issues', 'success: false'
    if (typeText.includes("typed") && typeText.includes("issues") && typeText.includes("success: false")) {
      debug("Detected Valibot validation error by structure - returning simplified schema");
      // Return a simplified schema to avoid processing array prototype methods
      return {
        type: "object",
        additionalProperties: false,
        properties: {
          success: { type: "boolean", const: false },
          typed: { type: "boolean" },
          output: { type: "object", additionalProperties: true },
          issues: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true
            }
          }
        },
        required: ["success", "typed", "issues", "output"]
      };
    }
    
    // Check for Zod validation errors in intersection
    if (typeText.includes("ZodSafeParseError") || typeText.includes("ZodError") || 
        (typeText.includes("error") && typeText.includes("issues") && typeText.includes("success: false"))) {
      debug("Detected Zod error in intersection");
      return {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [false] },
          error: {
            type: "object",
            properties: {
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    path: { type: "array", items: { type: ["string", "number"] } },
                    message: { type: "string" }
                  },
                  additionalProperties: true
                }
              }
            }
          }
        },
        required: ["success", "error"]
      };
    }
    
    const members = type.getIntersectionTypes();
    
    // Try to merge all intersection members into a single object schema
    // This handles cases like { success: false } & SafeParseResult
    const mergedSchema = { type: "object", properties: {}, required: [] as string[] };
    
    for (const member of members) {
      const memberSchema = buildSchema(member);
      if (memberSchema.type === "object" && memberSchema.properties) {
        Object.assign(mergedSchema.properties, memberSchema.properties);
        if (memberSchema.required) {
          mergedSchema.required.push(...memberSchema.required);
        }
      }
    }
    
    // If we successfully extracted properties, return the merged schema
    if (Object.keys(mergedSchema.properties).length > 0) {
      return mergedSchema.required.length > 0 ? mergedSchema : { type: "object", properties: mergedSchema.properties };
    }
    
    // Otherwise fall through to handle as regular object
  }
  
  // Handle primitive types
  if (type.isString()) return { type: "string" };
  if (type.isNumber()) return { type: "number" };
  if (type.isBoolean()) return { type: "boolean" };
  if (type.isArray()) {
    const arrType = type.getArrayElementType();
    if (!arrType) return { type: "array" };
    
    // Check if this is a validation issues array
    const arrTypeText = arrType.getText();
    if (arrTypeText.includes("Issue") || arrTypeText === "any") {
      debug("Detected validation issues array");
      return { 
        type: "array", 
        items: { 
          type: "object",
          properties: {
            message: { type: "string" },
            path: { type: ["array", "string"] },
            type: { type: "string" }
          },
          additionalProperties: true
        } 
      };
    }
    
    return { type: "array", items: buildSchema(arrType) };
  }
  
  // Handle any/unknown types
  if (type.isAny() || type.isUnknown()) {
    debug("Type is any/unknown, returning generic object schema");
    return { type: "object", additionalProperties: true };
  }

  // Try to extract properties from the type
  const props = type.getProperties();
  
  // If we have properties, build object schema from them
  if (props.length > 0) {
    debug(`Building schema from ${props.length} properties`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propsMap: Record<string, any> = {};
    const req: string[] = [];
    
    for (const p of props) {
      const propName = p.getName();
      
      // Skip symbol properties and internal properties
      if (propName.startsWith("__") || propName.startsWith("Symbol.")) {
        continue;
      }
      
      try {
        const decl = p.getValueDeclaration();
        if (decl) {
          const propType = decl.getType();
          propsMap[propName] = buildSchema(propType);
          if (!p.isOptional()) {
            req.push(propName);
          }
        }
      } catch (e) {
        debug(`Failed to process property ${propName}: ${e}`);
        // If we can't process a property, add it as a generic object
        propsMap[propName] = { type: "object", additionalProperties: true };
      }
    }
    
    if (Object.keys(propsMap).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = { type: "object", properties: propsMap };
      if (req.length) res.required = req;
      return res;
    }
  }

  // Check if it's a type literal or interface
  const decls = type.getSymbol()?.getDeclarations() || [];
  const isLit = decls.some(
    (d) =>
      d.getKind() === SyntaxKind.TypeLiteral ||
      d.getKind() === SyntaxKind.InterfaceDeclaration
  );
  
  if (!isLit) {
    // If we can't determine the structure, check the type text for hints
    const typeText = type.getText();
    debug(`Unable to determine structure for type: ${typeText.substring(0, 100)}`);
    
    // Detect Zod validation errors
    if (typeText.includes("z.ZodSafeParseError") || typeText.includes("ZodError")) {
      return {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [false] },
          error: {
            type: "object",
            properties: {
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    path: { type: "array", items: { type: ["string", "number"] } },
                    message: { type: "string" }
                  },
                  additionalProperties: true
                }
              }
            }
          }
        },
        required: ["success", "error"]
      };
    }
    
    // Detect Valibot validation errors (check for v. prefixed types)
    if (typeText.includes("v.") && (typeText.includes("Issue") || typeText.includes("success: false"))) {
      return {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [false] },
          typed: { type: "boolean" },
          output: { type: ["object", "null"], additionalProperties: true },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string" },
                type: { type: "string" },
                input: { type: ["string", "number", "boolean", "object", "array", "null"] },
                expected: { type: ["string", "null"] },
                received: { type: ["string", "null"] },
                message: { type: "string" },
                path: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      origin: { type: "string" },
                      input: { type: ["string", "number", "boolean", "object", "array", "null"] },
                      key: { type: ["string", "number", "null"] },
                      value: { type: ["string", "number", "boolean", "object", "array", "null"] }
                    }
                  }
                }
              },
              additionalProperties: true
            }
          }
        },
        required: ["success", "issues"]
      };
    }
    
    // Generic validation error fallback
    if (typeText.includes("SafeParseResult") || typeText.includes("success: false")) {
      return {
        type: "object",
        properties: {
          success: { type: "boolean", enum: [false] },
          error: { type: "object", additionalProperties: true },
          issues: { type: "array", items: { type: "object", additionalProperties: true } }
        },
        required: ["success"]
      };
    }
    
    // Default fallback for unknown object types
    return { type: "object", additionalProperties: true };
  }

  // Process type literal properties
  const literalProps = type
    .getProperties()
    .filter(
      (p) => p.getValueDeclaration()?.getKind() === SyntaxKind.PropertySignature
    );
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const propsMap: Record<string, any> = {};
  const req: string[] = [];
  for (const p of literalProps) {
    const decl = p.getValueDeclarationOrThrow();
    propsMap[p.getName()] = buildSchema(decl.getType());
    if (!p.isOptional()) req.push(p.getName());
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = { type: "object", properties: propsMap };
  if (req.length) res.required = req;
  return res;
}
