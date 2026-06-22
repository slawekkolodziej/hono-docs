# hono-docs TODO

## Current Priority: Showcase Platform

### Phase 1: serveOpenAPI Middleware ✅ COMPLETED
- [x] Implement minimal `serveOpenAPI` middleware
  - [x] Only rebuilds when `openapi.json` is missing (no file watching)
  - [x] Enhanced API: `serveOpenAPI({ config?: string, outputPath?: string, regenerate?: boolean })`
  - [x] Auto-detects config file if not provided (prioritizes .js/.mjs over .ts for runtime compatibility)
  - [x] Good error messages if generation fails
  - [x] Runtime compatibility improvements (checks ./openapi.json first before config loading)
- [x] Add to middleware exports from main package
- [x] Write comprehensive unit tests for the middleware (16 test cases)
- [x] Update integration tests to use `serveOpenAPI` (simple-router example)

### Phase 2: Enhanced OpenAPI Generation & Validation ✅ COMPLETED
- [x] **Multiple HTTP Status Code Support**
  - [x] Test and ensure different status codes are properly documented (401, 404, 500, etc.)
  - [x] Add integration test routes that return multiple status codes from same endpoint
  - [ ] Verify redirect responses (301, 302) are properly handled
  - [x] Test conditional responses (200 vs 201 based on logic)
  - [x] Ensure status-specific response schemas are generated correctly
- [x] **Validation Library Integration**
  - [x] **Zod integration testing**
    - [x] Query parameter validation with Zod schemas
    - [x] Request body (JSON) validation with Zod
    - [x] Path parameter validation with Zod
    - [x] Response validation with Zod
  - [x] **Valibot integration testing**
    - [x] Query parameter validation with Valibot schemas
    - [x] Request body (JSON) validation with Valibot
    - [x] Path parameter validation with Valibot
    - [x] Response validation with Valibot
  - [x] **Other popular validators**
    - [x] Consider testing with other validation libraries
    - [x] Ensure TypeScript inference works with all supported validators
- [x] **Quick validation via integration test updates**
  - [x] Add multi-status route to existing integration test
  - [x] Add Zod validation example to existing test
  - [x] Add Valibot validation example to existing test
  - [x] Verify generated OpenAPI specs include all status codes and validation schemas

### Phase 3: Convert Integration Tests to Standalone Apps
- [ ] Restructure integration tests as deployable Hono apps
  - [x] `simple-router/` → Full Hono app with API + docs UI (already production-ready)
  - [x] `grouped-simple/` → Showcase grouped routing patterns (already has Swagger UI)
  - [ ] `scalar-example/` → Beautiful Scalar documentation
  - [ ] `swagger-example/` → Classic Swagger UI interface
  - [x] `manual-routes/` → Custom route configuration example (already working)
  - [x] `validation-showcase/` → Comprehensive validation examples (Zod, Valibot, etc.) (already in simple-router)
  - [x] `status-codes/` → Demonstration of multiple status codes per route (already in simple-router)
- [x] Each app should have:
  - [x] Real API endpoints (not just stubs)
  - [x] `serveOpenAPI` middleware for spec serving
  - [x] Choice of Scalar or Swagger UI
  - [x] Proper error handling and responses
  - [x] Multiple status code examples
  - [x] Validation library demonstrations

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
**Priority 1**: ~~Implement `serveOpenAPI` middleware~~ ✅ **COMPLETED**
**Priority 2**: ~~Test/fix multiple status codes and validation libraries~~ ✅ **COMPLETED**
**Priority 3**: Deploy showcase platform to Vercel
**Priority 4**: Create master showcase app with navigation

### Quick Wins (Can Test Immediately) ✅ ALL COMPLETED
- [x] **Test multi-status routes**: Add a route that returns 200, 401, 404 to existing integration test
- [x] **Test Zod validation**: Add Zod-validated route to see if schemas are properly inferred
- [x] **Test Valibot validation**: Add Valibot-validated route to verify inference
- [x] **Verify current behavior**: Run existing tests and check what status codes/validation we already support

## Success Metrics
- [ ] Live showcase platform deployed and accessible
- [x] All integration tests working as real applications (simple-router + grouped-simple are production-ready)
- [x] Beautiful API documentation for each example (✅ serveOpenAPI + Scalar/Swagger UI working)
- [ ] Positive community feedback and adoption
- [ ] Real-world usage examples from users