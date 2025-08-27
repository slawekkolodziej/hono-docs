import { SourceFile } from "ts-morph";

export interface JSDocInfo {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
}

export interface RouteDocumentation {
  method: string;
  route: string;
  jsDoc: JSDocInfo;
}

/**
 * Extracts JSDoc comments from a source file and associates them with HTTP route methods
 */
export function extractJSDocFromSourceFile(sourceFile: SourceFile): RouteDocumentation[] {
  const documentation: RouteDocumentation[] = [];

  try {
    const sourceText = sourceFile.getFullText();
    
    // Find all JSDoc comments using regex
    const commentRanges = sourceText.match(/\/\*\*[\s\S]*?\*\//g);
    
    if (!commentRanges) {
      return documentation;
    }

    for (const comment of commentRanges) {
      try {
        // Find the position of this comment in the source
        const commentStart = sourceText.indexOf(comment);
        const commentEnd = commentStart + comment.length;
        
        // Parse JSDoc tags from this comment
        const jsDocInfo = parseJSDocComment(comment);
        
        // Skip if no useful JSDoc information was extracted
        if (!jsDocInfo.summary && !jsDocInfo.description && !jsDocInfo.tags && !jsDocInfo.deprecated) {
          continue;
        }
        
        // Try to find the next method call after this comment
        // Look for patterns like .get("/path" or .post('/path' with optional whitespace
        const textAfterComment = sourceText.substring(commentEnd);
        const methodMatch = textAfterComment.match(/\.\s*(\w+)\s*\(\s*["']([^"']+)["']/);
        
        if (methodMatch) {
          const [, method, route] = methodMatch;
          const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
          
          if (httpMethods.includes(method.toLowerCase())) {
            documentation.push({
              method: method.toLowerCase(),
              route: route,
              jsDoc: jsDocInfo
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing JSDoc comment: ${error}`);
        // Continue processing other comments
        continue;
      }
    }

  } catch (error) {
    console.warn(`⚠️ Error extracting JSDoc from source file: ${error}`);
    // Return empty array on error to avoid breaking the entire generation
    return [];
  }

  return documentation;
}

/**
 * Parses a JSDoc comment string and extracts structured information
 */
export function parseJSDocComment(comment: string): JSDocInfo {
  const jsDocInfo: JSDocInfo = {};
  
  try {
    const lines = comment.split('\n');
    let currentDescription = '';
    const allTags: string[] = [];
    
    for (const line of lines) {
      // Remove leading *, whitespace, and /** */ markers
      let trimmedLine = line.trim();
      if (trimmedLine.startsWith('*')) {
        trimmedLine = trimmedLine.substring(1).trim();
      }
      if (trimmedLine.startsWith('/**')) {
        trimmedLine = trimmedLine.substring(3).trim();
      }
      if (trimmedLine.endsWith('*/')) {
        trimmedLine = trimmedLine.substring(0, trimmedLine.length - 2).trim();
      }
      
      if (trimmedLine.startsWith('@summary ')) {
        jsDocInfo.summary = trimmedLine.substring(9).trim();
      } else if (trimmedLine.startsWith('@description ')) {
        jsDocInfo.description = trimmedLine.substring(13).trim();
      } else if (trimmedLine.startsWith('@tags ')) {
        const tagsStr = trimmedLine.substring(6).trim();
        if (tagsStr) {
          const newTags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag);
          allTags.push(...newTags);
        }
      } else if (trimmedLine.startsWith('@deprecated')) {
        const deprecatedValue = trimmedLine.substring(12).trim();
        jsDocInfo.deprecated = deprecatedValue === '' || deprecatedValue === 'true' || deprecatedValue !== 'false';
      } else if (trimmedLine && 
                 !trimmedLine.startsWith('@') && 
                 trimmedLine !== '/**' && 
                 trimmedLine !== '*/') {
        // This is part of the main description
        if (currentDescription) {
          currentDescription += ' ';
        }
        currentDescription += trimmedLine;
      }
    }
    
    // Set tags if any were found
    if (allTags.length > 0) {
      jsDocInfo.tags = [...new Set(allTags)]; // Remove duplicates
    }
    
    // If no explicit @description but we have description text, use it
    if (!jsDocInfo.description && currentDescription.trim()) {
      jsDocInfo.description = currentDescription.trim();
    }
    
  } catch (error) {
    console.warn(`⚠️ Error parsing JSDoc comment: ${error}`);
    // Return empty object on error to avoid breaking the entire generation
  }
  
  return jsDocInfo;
}

/**
 * Creates a lookup map for quick access to JSDoc info by method and route
 */
export function createJSDocLookup(documentation: RouteDocumentation[]): Map<string, JSDocInfo> {
  const lookup = new Map<string, JSDocInfo>();
  
  for (const doc of documentation) {
    const key = `${doc.method}:${doc.route}`;
    lookup.set(key, doc.jsDoc);
  }
  
  return lookup;
}