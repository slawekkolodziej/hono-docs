import { SyntaxKind } from "ts-morph";
import createDebug from "debug";

const debug = createDebug("hono-docs:buildSchema");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSchema(
  type: import("ts-morph").Type,
  location?: import("ts-morph").Node
): any {
  const getSymbolType = (symbol: import("ts-morph").Symbol) => {
    const declaration = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
    return (location ? symbol.getTypeAtLocation(location) : undefined) || declaration?.getType();
  };
  const getTypeText = (target: import("ts-morph").Type) =>
    location ? target.getText(location) : target.getText();

  const initialTypeText = getTypeText(type);
  if (
    initialTypeText.includes("SafeParseError") ||
    initialTypeText.includes("ZodSafeParseError") ||
    initialTypeText.includes("ZodError")
  ) {
    return {
      type: "object",
      properties: {
        success: { type: "boolean", const: false },
        error: {
          type: "object",
          properties: {
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  path: { type: "array", items: { oneOf: [{ type: "string" }, { type: "number" }] } },
                  message: { type: "string" },
                },
                required: ["code", "path", "message"],
                additionalProperties: false,
              },
            },
          },
          required: ["issues"],
          additionalProperties: false,
        },
      },
      required: ["success", "error"],
      additionalProperties: false,
    };
  }

  if (
    initialTypeText.includes("SafeParseResult") ||
    (initialTypeText.includes("issues") && initialTypeText.includes("success"))
  ) {
    return {
      type: "object",
      properties: {
        success: { type: "boolean", const: false },
        typed: { type: "boolean" },
        output: { type: "object", additionalProperties: true },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              input: {},
              message: { type: "string" },
              path: { type: "array", items: { oneOf: [{ type: "string" }, { type: "number" }] } },
            },
            additionalProperties: true,
          },
        },
      },
      required: ["success", "typed", "issues", "output"],
      additionalProperties: false,
    };
  }

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
    return { oneOf: nonNull.map((member) => buildSchema(member, location)) };
  }
  
  // Handle intersection types (common with validator error responses)
  if (type.isIntersection()) {
    const typeText = getTypeText(type);
    debug("Processing intersection type: %s", typeText.substring(0, 200));
    
    // Detect validation library error types and handle them specifically
    if (
      typeText.includes("SafeParseError") ||
      typeText.includes("ZodSafeParseError") ||
      typeText.includes("ZodError")
    ) {
      debug("Detected Zod validation error in intersection");
      // For Zod errors, we want only: success, error (with issues)
      return {
        type: "object",
        properties: {
          success: { type: "boolean", const: false },
          error: {
            type: "object",
            properties: {
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    path: { type: "array", items: { oneOf: [{ type: "string" }, { type: "number" }] } },
                    message: { type: "string" }
                  },
                  required: ["code", "path", "message"],
                  additionalProperties: false
                }
              }
            },
            required: ["issues"],
            additionalProperties: false
          }
        },
        required: ["success", "error"],
        additionalProperties: false
      };
    }
    
    if (typeText.includes("typed") && typeText.includes("issues") && typeText.includes("success: false")) {
      debug("Detected Valibot validation error in intersection");
      // For Valibot errors, we want: success, typed, output, issues
      const members = type.getIntersectionTypes();
      
      // Try to extract the actual output type from the intersection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let outputSchema: any = { type: "object", additionalProperties: true };
      for (const member of members) {
        const outputProp = member.getProperty("output");
        if (outputProp) {
          try {
            const outputType = getSymbolType(outputProp);
            if (outputType) {
              outputSchema = buildSchema(outputType, location);
            }
          } catch (e) {
            debug("Could not extract Valibot output type: %s", e);
          }
        }
      }
      
      return {
        type: "object",
        properties: {
          success: { type: "boolean", const: false },
          typed: { type: "boolean" },
          output: outputSchema,
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                input: {},
                message: { type: "string" },
                path: { type: "array", items: { oneOf: [{ type: "string" }, { type: "number" }] } }
              },
              additionalProperties: true
            }
          }
        },
        required: ["success", "typed", "issues", "output"],
        additionalProperties: false
      };
    }
    
    // For other intersection types, try generic merging
    const members = type.getIntersectionTypes();
    const mergedSchema = { type: "object", properties: {}, required: [] as string[] };
    let hasValidProperties = false;
    
    for (const member of members) {
      const memberProps = member.getProperties();
      
      for (const prop of memberProps) {
        const propName = prop.getName();
        
        // Skip prototype and method properties
        if (propName.includes("constructor") || propName.includes("prototype") || 
            propName.includes("valueOf") || propName.includes("toString") || 
            propName.includes("hasOwnProperty") || typeof propName !== "string" ||
            propName.length > 20) { // Skip very long property names (likely methods)
          continue;
        }
        
        try {
          const propType = getSymbolType(prop);
          if (propType) {
            mergedSchema.properties[propName] = buildSchema(propType, location);
            
            if (!prop.isOptional()) {
              mergedSchema.required.push(propName);
            }
            hasValidProperties = true;
          }
        } catch (error) {
          debug("Error processing intersection property %s: %s", propName, error);
          continue;
        }
      }
    }
    
    if (hasValidProperties && Object.keys(mergedSchema.properties).length > 0) {
      debug("Successfully merged intersection with %d properties", Object.keys(mergedSchema.properties).length);
      return mergedSchema.required.length > 0 ? mergedSchema : { type: "object", properties: mergedSchema.properties };
    }
  }
  
  // Handle primitive types
  if (type.isString()) return { type: "string" };
  if (type.isNumber()) return { type: "number" };
  if (type.isBoolean()) return { type: "boolean" };
  
  // Handle literal types (like success: false, typed: true)
  if (type.isBooleanLiteral()) {
    return { type: "boolean", const: type.getLiteralValue() };
  }
  if (type.isStringLiteral()) {
    return { type: "string", const: type.getLiteralValue() };
  }
  if (type.isNumberLiteral()) {
    return { type: "number", const: type.getLiteralValue() };
  }
  
  if (type.isArray()) {
    const arrType = type.getArrayElementType();
    if (!arrType) return { type: "array" };
    
    // Check if this is a validation issues array
    const arrTypeText = getTypeText(arrType);
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
    
    return { type: "array", items: buildSchema(arrType, location) };
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
    debug("Building schema from %d properties", props.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propsMap: Record<string, any> = {};
    const req: string[] = [];
    
    for (const p of props) {
      const propName = p.getName();
      
      // Skip problematic prototype methods
      if (propName.includes("constructor") || propName.includes("prototype") || 
          propName.includes("valueOf") || propName.includes("toString") || 
          propName.includes("hasOwnProperty")) {
        continue;
      }
      
      try {
        const propDeclaration = p.getValueDeclaration();
        if (propDeclaration) {
          const propType = propDeclaration.getType();
          propsMap[propName] = buildSchema(propType, location);
        } else {
          const propType = getSymbolType(p);
          if (!propType) continue;
          propsMap[propName] = buildSchema(propType, location);
        }
        if (!p.isOptional()) {
          req.push(propName);
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
    // Final fallback for truly unknown types
    debug("Unable to determine structure for type: %s", getTypeText(type).substring(0, 100));
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
