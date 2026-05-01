# Changelog

All notable changes to `@formegifts/mcp` are documented here.
Versions follow [Semantic Versioning](https://semver.org/).

## 0.3.4 — 2026-05-01

### Changed

- Recommended MCP server key in install examples changed from `"forme"` to `"formegifts"` for consistency with the npm package name (`@formegifts/mcp`). Existing users with `"forme"` in their host config don't need to change anything — the server itself doesn't care about the key.

## 0.3.3 — 2026-04-30

### Changed

- Publishing to npm is now automated via GitHub Actions on tag push (`v*.*.*`). No more manual `npm publish`.

## 0.3.2 — 2026-04-30

### Fixed

- `SERVER_VERSION` (the version the MCP server advertises to hosts via `McpServer({ name, version })`) was hardcoded as `'0.1.0'` and had drifted six releases behind the package version. It is now injected at build time from `package.json` via tsup's `define`, so it always matches the published version.

## 0.3.1 — 2026-04-30

### Changed

- README leads with the in-host `auth_start` flow. Terminal `auth` command kept as a secondary path for CI / pre-warming credentials.

## 0.3.0 — 2026-04-30

### Added

- `auth_start` and `auth_poll` MCP tools — sign in directly through the MCP host (Claude Code, Claude Desktop, Cursor, etc.) without dropping to a terminal. `auth_start` returns a verification URL and short user code; `auth_poll` blocks for up to 45s waiting for the user to approve in the browser, then persists credentials.

### Changed

- Device flow now reports `client_type='mcp'` instead of `'cli'`. The web app's authorization screen labels the request as "Forme MCP server" instead of "Forme CLI".
- `pollDeviceCode` returns `{status:'expired'}` instead of throwing on `expired_token`. CLI behavior is unchanged.
- `unauthenticated` re-auth message now points users to the `auth_start` tool first, with the terminal `formegifts-mcp auth` command as a fallback.

## 0.2.2 — 2026-04-30

### Fixed

- Restored `forme-mcp` as first bin entry so `npx @formegifts/mcp` continues to work; `formegifts-mcp` is the second entry (global install alias).

## 0.2.1 — 2026-04-30

### Added

- `formegifts-mcp` bin alias — canonical command, scoped to match the npm package `@formegifts/mcp`. `forme-mcp` remains as a backwards-compatible alias.

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
