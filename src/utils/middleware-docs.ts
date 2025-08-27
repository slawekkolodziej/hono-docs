import { SourceFile, SyntaxKind, CallExpression } from "ts-morph";

export interface DocConfig {
  summary?: string
  description?: string  
  tags?: string[]
  deprecated?: boolean
}

export interface RouteDocumentation {
  method: string;
  route: string;
  docConfig: DocConfig;
}

/**
 * Extracts documentation from doc() middleware calls in the source file
 * This is much more reliable than parsing JSDoc comments
 */
export function extractDocumentationFromMiddleware(sourceFile: SourceFile): RouteDocumentation[] {
  const documentation: RouteDocumentation[] = [];

  try {
    // Find all call expressions in the file
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    for (const call of callExpressions) {
      try {
        // Check if this is an HTTP method call (.get, .post, etc.)
        const expression = call.getExpression();
        
        if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
          const propertyAccess = expression.asKind(SyntaxKind.PropertyAccessExpression)!;
          const methodName = propertyAccess.getName();
          
          // Check if it's an HTTP method
          const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
          if (httpMethods.includes(methodName.toLowerCase())) {
            
            // Extract the route path from the first argument
            const args = call.getArguments();
            if (args.length >= 2) { // At least route + one middleware/handler
              const routeArg = args[0];
              
              if (routeArg.getKind() === SyntaxKind.StringLiteral) {
                const route = routeArg.getText().replace(/['"]/g, '');
                
                // Look for doc() middleware in the arguments
                const docConfig = findDocMiddlewareInArgs(args.slice(1)); // Skip route argument
                
                if (docConfig && hasUsefulDocConfig(docConfig)) {
                  documentation.push({
                    method: methodName.toLowerCase(),
                    route: route,
                    docConfig: docConfig
                  });
                  
                  console.log(`🔍 Found doc() middleware for ${methodName.toUpperCase()} ${route}:`, docConfig);
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing call expression: ${error}`);
        continue;
      }
    }

  } catch (error) {
    console.warn(`⚠️ Error extracting documentation from middleware: ${error}`);
  }

  return documentation;
}

/**
 * Searches through route arguments to find doc() middleware calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findDocMiddlewareInArgs(args: any[]): DocConfig | null {
  for (const arg of args) {
    try {
      // Check if this argument is a call expression (like doc(...))
      if (arg.getKind() === SyntaxKind.CallExpression) {
        const callExpr = arg as CallExpression;
        const expression = callExpr.getExpression();
        
        // Check if it's a call to 'doc'
        if (expression.getKind() === SyntaxKind.Identifier) {
          const identifier = expression.asKind(SyntaxKind.Identifier)!;
          
          if (identifier.getText() === 'doc') {
            // Found doc() call - extract the configuration object
            const docArgs = callExpr.getArguments();
            if (docArgs.length > 0) {
              const configArg = docArgs[0];
              
              // Parse the configuration object
              return parseDocConfigObject(configArg);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error processing middleware argument: ${error}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Parses a TypeScript object literal to extract DocConfig
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDocConfigObject(objectNode: any): DocConfig {
  const config: DocConfig = {};
  
  try {
    if (objectNode.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const properties = objectNode.getProperties();
      
      for (const prop of properties) {
        if (prop.getKind() === SyntaxKind.PropertyAssignment) {
          const propAssignment = prop.asKind(SyntaxKind.PropertyAssignment)!;
          const propName = propAssignment.getName();
          const propValue = propAssignment.getInitializer();
          
          if (propValue) {
            switch (propName) {
              case 'summary':
                if (propValue.getKind() === SyntaxKind.StringLiteral) {
                  config.summary = propValue.getText().replace(/['"]/g, '');
                }
                break;
                
              case 'description':
                if (propValue.getKind() === SyntaxKind.StringLiteral) {
                  config.description = propValue.getText().replace(/['"]/g, '');
                }
                break;
                
              case 'tags':
                if (propValue.getKind() === SyntaxKind.ArrayLiteralExpression) {
                  const arrayExpr = propValue.asKind(SyntaxKind.ArrayLiteralExpression)!;
                  const tags: string[] = [];
                  
                  for (const element of arrayExpr.getElements()) {
                    if (element.getKind() === SyntaxKind.StringLiteral) {
                      tags.push(element.getText().replace(/['"]/g, ''));
                    }
                  }
                  
                  config.tags = tags;
                }
                break;
                
              case 'deprecated':
                if (propValue.getKind() === SyntaxKind.TrueKeyword) {
                  config.deprecated = true;
                } else if (propValue.getKind() === SyntaxKind.FalseKeyword) {
                  config.deprecated = false;
                }
                break;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Error parsing doc config object: ${error}`);
  }
  
  return config;
}

/**
 * Checks if a DocConfig has any useful documentation information
 */
function hasUsefulDocConfig(config: DocConfig): boolean {
  return !!(
    config.summary?.trim() ||
    config.description?.trim() ||
    (config.tags && config.tags.length > 0) ||
    config.deprecated === true ||
    config.deprecated === false
  );
}

/**
 * Creates a lookup map for quick access to doc config by method and route
 */
export function createDocLookup(documentation: RouteDocumentation[]): Map<string, DocConfig> {
  const lookup = new Map<string, DocConfig>();
  
  for (const doc of documentation) {
    const key = `${doc.method}:${doc.route}`;
    lookup.set(key, doc.docConfig);
  }
  
  return lookup;
}