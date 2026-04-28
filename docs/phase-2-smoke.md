# Phase 2 Manual Smoke Test

**Requires:**
- Phase 1 smoke completed (you have valid credentials at `~/.config/forme/credentials.json`).
- `claude` CLI installed (Claude Code).
- Either local Supabase running (`cd ../forme.gifts && supabase start && bun dev`) OR production credentials.

## Local setup

```sh
# build the package
bun run build
```

The `FORME_*` env vars are read at **runtime** (config.ts reads `process.env` on import), so they must be set in the shell that spawns the server **and** in any shell that runs the auth CLI directly. Claude Code inherits your shell env when it spawns MCP servers.

Set them inline whenever you invoke the CLI or build, e.g.:

```sh
FORME_API_BASE=http://localhost:3000 \
FORME_SUPABASE_URL=http://localhost:54321 \
FORME_SUPABASE_ANON_KEY=<local-anon> \
node dist/bin.js auth
```

Common gotcha: setting the vars with `export` in one terminal and running `node` in another — they don't carry over. Use the inline form, or `export` and re-run in the same shell.

## Add to Claude Code

Pass `FORME_*` env vars via `--env` so Claude Code propagates them to the spawned MCP server (Claude Code's process env is not the same as your shell env, so an `export` in your terminal won't reach the server unless Claude Code itself was launched from that shell).

```sh
claude mcp remove forme-local 2>/dev/null  # ignore "not found" on first run
claude mcp add --scope user forme-local \
  --env FORME_API_BASE=http://localhost:3000 \
  --env FORME_SUPABASE_URL=http://localhost:54321 \
  --env FORME_SUPABASE_ANON_KEY=<local-anon> \
  -- node $(pwd)/dist/bin.js
```

Restart Claude Code. In a new conversation:

1. Ask: "List my wishlists." Claude should call `list_wishlists` and return the list with gift counts.
2. Ask: "Show me everything in my Kitchen wishlist" (use a real name from step 1). Claude calls `get_wishlist` with `{ name: "Kitchen" }` and returns the wishlist + gifts.
3. Ask: "Get the wishlist with id <real-uuid>." Same tool, dispatched by id.

## Negative checks

> **Gotcha:** for local dev, if you forget the `--env` flags the server silently falls back to the production defaults baked into `config.ts`. `list_wishlists` will return *production* data instead of localhost. Re-add the MCP with the `--env` flags above to scope it to your local stack.

1. Edit `~/.config/forme/credentials.json` and corrupt the refresh token. Ask Claude to list wishlists. The tool result should carry `{ code: "unauthenticated", retryable: false }` and a message telling the user to run `forme-mcp auth`.
2. Restore credentials by re-running the auth CLI. Pre-publish (running from `dist/`), use the inline form:

   ```sh
   FORME_API_BASE=http://localhost:3000 \
   FORME_SUPABASE_URL=http://localhost:54321 \
   FORME_SUPABASE_ANON_KEY=<local-anon> \
   node dist/bin.js auth
   ```

   The first line printed should be `To sign in, open: http://localhost:3000/auth/device?code=…`. If it shows `https://forme.gifts/...`, `FORME_API_BASE` didn't reach the process — re-run inline as above.

3. Ask Claude to fetch a wishlist by a non-existent name. Tool result should carry `{ code: "invalid_argument", ... }`.

## Cleanup

```sh
claude mcp remove forme-local
```

## Production smoke

Same flow without the `FORME_*` env vars (defaults point at prod). Use a low-stakes account. Auth CLI: `node dist/bin.js auth` (or `forme-mcp auth` once published).
