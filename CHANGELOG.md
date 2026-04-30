# Changelog

All notable changes to `@formegifts/mcp` are documented here.
Versions follow [Semantic Versioning](https://semver.org/).

## 0.2.0 — 2026-04-30

### Added

Full create / update / delete surface for wishlists and gifts:

- `create_wishlist`, `update_wishlist`, `delete_wishlist`
- `create_gift`, `update_gift`, `delete_gift`

Destructive operations (`delete_wishlist`, `delete_gift`) follow a
**confirm-required** pattern:

1. The first call returns a dry-run summary (wishlist name + nested gift count, or gift name).
2. The agent re-issues the call with `confirm: true` to actually delete.

This prevents an LLM from deleting data on a single ambiguous instruction.

All tool inputs are strict — extra fields are rejected at the schema boundary.

### Changed

Clearer error mapping for common cases:

- Expired or invalid sessions are now reported as `unauthenticated` with a
  message that points at `npx @formegifts/mcp auth`. Previously these could
  surface as a generic retryable error.
- Hitting a wishlist or gift tier cap is now reported as `resource_exhausted`,
  so the client can render an upgrade prompt instead of a generic failure.
- Custom database constraint violations are reported as `failed_precondition`.

### Fixed

`create_wishlist` and `create_gift` now go through the same write path as the
web app, which means tier caps and ownership are enforced consistently across
both surfaces.

## 0.1.1 — 2026-04-28

Initial public release.

- Read tools: `list_wishlists`, `get_wishlist`.
- Auth CLI: `auth`, `whoami`, `logout` via Supabase device-code flow.
- Reactive token refresh; credentials at `~/.config/forme/credentials.json` (`chmod 600`).
- Error envelope mapped from Supabase / PostgREST errors to MCP tool error codes.
