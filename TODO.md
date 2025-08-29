# hono-docs TODO

## Current Priority: Showcase Platform

### Phase 1: serveOpenAPI Middleware
- [ ] Implement minimal `serveOpenAPI` middleware
  - [ ] Only rebuilds when `openapi.json` is missing (no file watching)
  - [ ] Simple API: `serveOpenAPI({ config?: string })`
  - [ ] Auto-detects config file if not provided
  - [ ] Good error messages if generation fails
- [ ] Add to middleware exports from main package
- [ ] Write unit tests for the middleware
- [ ] Update integration tests to use `serveOpenAPI`

### Phase 2: Enhanced OpenAPI Generation & Validation
- [ ] **Multiple HTTP Status Code Support**
  - [ ] Test and ensure different status codes are properly documented (401, 404, 500, etc.)
  - [ ] Add integration test routes that return multiple status codes from same endpoint
  - [ ] Verify redirect responses (301, 302) are properly handled
  - [ ] Test conditional responses (200 vs 201 based on logic)
  - [ ] Ensure status-specific response schemas are generated correctly
- [ ] **Validation Library Integration**
  - [ ] **Zod integration testing**
    - [ ] Query parameter validation with Zod schemas
    - [ ] Request body (JSON) validation with Zod
    - [ ] Path parameter validation with Zod
    - [ ] Response validation with Zod
  - [ ] **Valibot integration testing**
    - [ ] Query parameter validation with Valibot schemas
    - [ ] Request body (JSON) validation with Valibot
    - [ ] Path parameter validation with Valibot
    - [ ] Response validation with Valibot
  - [ ] **Other popular validators**
    - [ ] Consider testing with other validation libraries
    - [ ] Ensure TypeScript inference works with all supported validators
- [ ] **Quick validation via integration test updates**
  - [ ] Add multi-status route to existing integration test
  - [ ] Add Zod validation example to existing test
  - [ ] Add Valibot validation example to existing test
  - [ ] Verify generated OpenAPI specs include all status codes and validation schemas

### Phase 3: Convert Integration Tests to Standalone Apps
- [ ] Restructure integration tests as deployable Hono apps
  - [ ] `simple-router/` → Full Hono app with API + docs UI
  - [ ] `grouped-apis/` → Showcase grouped routing patterns
  - [ ] `scalar-example/` → Beautiful Scalar documentation
  - [ ] `swagger-example/` → Classic Swagger UI interface
  - [ ] `manual-routes/` → Custom route configuration example
  - [ ] `validation-showcase/` → Comprehensive validation examples (Zod, Valibot, etc.)
  - [ ] `status-codes/` → Demonstration of multiple status codes per route
- [ ] Each app should have:
  - [ ] Real API endpoints (not just stubs)
  - [ ] `serveOpenAPI` middleware for spec serving
  - [ ] Choice of Scalar or Swagger UI
  - [ ] Proper error handling and responses
  - [ ] Multiple status code examples
  - [ ] Validation library demonstrations

### Phase 4: Master Showcase App
- [ ] Create main landing page app
  - [ ] Project overview and features
  - [ ] Links to live examples
  - [ ] Getting started guide
  - [ ] API documentation
- [ ] Merge all integration test apps into master app
  - [ ] `/examples/simple-router` → simple-router app
  - [ ] `/examples/grouped-apis` → grouped-apis app
  - [ ] `/examples/scalar-demo` → scalar-example app
  - [ ] `/examples/swagger-demo` → swagger-example app
- [ ] Create utility to combine apps cleanly
- [ ] Add navigation between examples

### Phase 5: Vercel Deployment
- [ ] Set up Vercel project configuration
- [ ] Configure build process to generate all OpenAPI specs
- [ ] Set up proper routing for all sub-apps
- [ ] Configure static file serving for specs
- [ ] Add deployment environment variables if needed
- [ ] Test deployment and fix any Vercel-specific issues

### Phase 6: CI/CD Integration
- [ ] Add GitHub Actions to regenerate OpenAPI specs on changes
- [ ] Automated deployment to Vercel on main branch changes
- [ ] Add status checks for spec generation
- [ ] Consider adding visual diff checks for OpenAPI changes

## Future Enhancements

### Documentation & Examples
- [ ] Add more complex real-world examples
- [ ] Create tutorial showing step-by-step usage
- [ ] Add performance benchmarking examples
- [ ] Show integration with popular Hono patterns

### Developer Experience
- [ ] Consider adding VS Code extension for better DX
- [ ] Add CLI commands for common operations
- [ ] Better error messages and debugging info
- [ ] Configuration validation and helpful warnings

### Advanced Features (Low Priority)
- [ ] Custom theme support for generated docs
- [ ] Plugin system for extending functionality
- [ ] Integration with other documentation tools
- [ ] Advanced caching strategies for large APIs

## Technical Debt & Improvements
- [ ] Add more comprehensive error handling throughout
- [ ] Improve TypeScript inference in edge cases
- [ ] Consider workspace structure for better organization
- [ ] Add performance optimizations for large APIs
- [ ] Better memory management for large codebases

## Community & Ecosystem
- [ ] Create contribution guidelines
- [ ] Add issue templates for better bug reports
- [ ] Consider creating example templates for common patterns
- [ ] Integration guides for popular frameworks/tools
- [ ] Community showcase of real-world usage

---

## Current Focus
**Priority 1**: Implement `serveOpenAPI` middleware
**Priority 2**: Test/fix multiple status codes and validation libraries
**Priority 3**: Convert integration tests to standalone apps  
**Priority 4**: Deploy showcase platform to Vercel

### Quick Wins (Can Test Immediately)
- [ ] **Test multi-status routes**: Add a route that returns 200, 401, 404 to existing integration test
- [ ] **Test Zod validation**: Add Zod-validated route to see if schemas are properly inferred
- [ ] **Test Valibot validation**: Add Valibot-validated route to verify inference
- [ ] **Verify current behavior**: Run existing tests and check what status codes/validation we already support

## Success Metrics
- [ ] Live showcase platform deployed and accessible
- [ ] All integration tests working as real applications
- [ ] Beautiful API documentation for each example
- [ ] Positive community feedback and adoption
- [ ] Real-world usage examples from users