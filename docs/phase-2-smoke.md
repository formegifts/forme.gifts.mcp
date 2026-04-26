# Phase 2 Manual Smoke Test

**Requires:**
- Phase 1 smoke completed (you have valid credentials at `~/.config/forme/credentials.json`).
- `claude` CLI installed (Claude Code).
- Either local Supabase running (`cd ../forme.gifts && supabase start && bun dev`) OR production credentials.

## Local setup

```sh
# build the package
FORME_API_BASE=http://localhost:3000 \
FORME_SUPABASE_URL=http://localhost:54321 \
FORME_SUPABASE_ANON_KEY=<local-anon> \
bun run build
```

The env vars matter at **runtime** (config.ts reads `process.env` on import), so what counts is the shell that spawns the server. Claude Code inherits your shell env when it spawns MCP servers.

## Add to Claude Code

```sh
claude mcp add --scope user forme-local -- node $(pwd)/dist/bin.js
```

Restart Claude Code. In a new conversation:

1. Ask: "List my wishlists." Claude should call `list_wishlists` and return the list with gift counts.
2. Ask: "Show me everything in my Kitchen wishlist" (use a real name from step 1). Claude calls `get_wishlist` with `{ name: "Kitchen" }` and returns the wishlist + gifts.
3. Ask: "Get the wishlist with id <real-uuid>." Same tool, dispatched by id.

## Negative checks

1. Edit `~/.config/forme/credentials.json` and corrupt the refresh token. Ask Claude to list wishlists. The tool result should carry `{ code: "unauthenticated", retryable: false }` and a message telling the user to run `forme-mcp auth`.
2. Restore credentials with `forme-mcp auth`.
3. Ask Claude to fetch a wishlist by a non-existent name. Tool result should carry `{ code: "invalid_argument", ... }`.

## Cleanup

```sh
claude mcp remove forme-local
```

## Production smoke

Same flow without the `FORME_*` env vars (defaults point at prod). Use a low-stakes account.
