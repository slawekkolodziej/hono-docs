# @hono/zod-validator dev stub

This package is a local development stub for testing `hono-docs` against
unreleased changes from the separate `middleware` repository.

It intentionally links only `src/` from `../middleware/packages/zod-validator`
and keeps dependencies as peers, so `hono-docs` provides `hono` and `zod` during
local integration tests.
