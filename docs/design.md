# forme.gifts MCP Server — Design

**Status:** design locked 2026-04-24

## Problem

AI agents (Claude Code, Claude Desktop, Cursor, custom MCP clients) are becoming the primary interface for managing personal workflows. A wishlist app with no programmatic surface is invisible to this ecosystem. An earlier framing proposed a terminal CLI (`forme add`, `forme list`, …) as the programmatic surface — but a CLI is the wrong primary shape for agents. An MCP server gives agents discoverable tool schemas, one-click install inside hosts, per-tool permissions, and no shell-parsing overhead. The CLI framing is deferred; V1 is MCP-first.

## Solution Overview

A single npm package **`@formegifts/mcp`** that ships:

1. An **MCP stdio server** — the main product; hosts launch it over stdio to call tools.
2. A **tiny auth CLI** — three operational subcommands (`auth`, `auth logout`, `whoami`) on the same binary, for the one-time browser sign-in and session admin. Not a product CLI — there is no `forme-mcp add`, `forme-mcp list`, etc.

A second, separate package (`@formegifts/cli`) with full human-facing commands (pretty tables, interactive pickers, `forme add "Moka pot" ...`) is **deferred**. Both packages will eventually share a core client, but V1 scope is the MCP package only.

## Architecture

### Repo layout

The MCP package lives in its own repo, separate from the web app:

1. **No monorepo setup exists in the web app** — adding bun workspaces, scoping every `check:*` / `build` / `test` script, and adjusting CI/Netlify config is a meaningful project of its own for one package. Cost > benefit at V1.
2. **The MCP package is operationally independent** — it consumes the web app's existing REST + Supabase surface, ships on its own version cadence, and has its own CI.
3. **Upgrade path is open.** If a real monorepo (cli + mcp + shared client together) makes sense later, absorbing a standalone repo is cheap. Both directions are reversible.

```
forme.gifts.mcp/
├── package.json               # name: "@formegifts/mcp", bin: "forme-mcp"
├── tsconfig.json
├── src/
│   ├── bin.ts                 # CLI entry — dispatches subcommands
│   ├── server.ts              # MCP stdio server wiring
│   ├── auth/
│   │   ├── device-flow.ts     # POST /api/auth/device + polling
│   │   ├── credentials.ts     # read/write ~/.config/forme/credentials.json
│   │   └── refresh.ts         # silent access-token refresh
│   ├── tools/                 # one file per MCP tool
│   │   ├── list-wishlists.ts
│   │   ├── get-wishlist.ts
│   │   ├── create-wishlist.ts
│   │   ├── update-wishlist.ts
│   │   ├── delete-wishlist.ts
│   │   ├── create-gift.ts
│   │   ├── update-gift.ts
│   │   ├── delete-gift.ts
│   │   └── add-gift-from-url.ts
│   ├── schemas/               # vendored Zod schemas (see below)
│   │   ├── gift.ts
│   │   └── wishlist.ts
│   ├── supabase.ts            # scoped supabase-js client factory
│   └── errors.ts              # Supabase → MCP error mapping
└── test/
    ├── tools/                 # unit tests per tool
    └── integration/           # device flow + tool round-trip
```

### Zod schema sharing

Gift and wishlist shapes are authored in the web app and **vendored** into this repo's `src/schemas/` — manually copied, with a top-of-file header marking them as vendored.

```ts
// Vendored from the web app — keep in sync when schemas change there.
// Integration tests catch drift by exercising each tool against a real Supabase row.
```

This trades runtime coupling for occasional manual sync. Drift risk is mitigated by integration tests that insert/update/select real rows — a schema mismatch fails CI loudly. A shared `@formegifts/schemas` package is possible later if the sync burden grows, but premature for V1.

### Binary and subcommands

The `forme-mcp` binary is the single entry point. Default (no args) runs the MCP server.

| Invocation | Purpose |
|---|---|
| `npx -y @formegifts/mcp` *(or `forme-mcp serve`)* | MCP stdio server — what host configs point to |
| `forme-mcp auth` | Runs OAuth device flow, opens browser, polls, writes tokens to disk |
| `forme-mcp auth logout` | Deletes stored credentials |
| `forme-mcp whoami` | Prints signed-in email + tier |

The auth subcommand is the one human moment in the product — users run it once in a real terminal. Standard pattern (`gh auth login`, `supabase login`, `gcloud auth login`). The MCP server never initiates auth; if credentials are missing or unrecoverable, tools return a structured error instructing the user to run `forme-mcp auth`.

### Tool surface

Nine tools. Verb-first naming per MCP convention.

| Tool | Inputs | Output |
|---|---|---|
| `list_wishlists` | — | `Wishlist[]` with `id`, `name`, `description`, `gift_count`, `updated_at` |
| `get_wishlist` | `id \| name` | `Wishlist & { gifts: Gift[] }` |
| `create_wishlist` | `name`, `description?` | Created `Wishlist` |
| `update_wishlist` | `id`, `name?`, `description?` | Updated `Wishlist` |
| `delete_wishlist` | `id`, `confirm: true` | `{ deleted: true, id }` — destructive, requires explicit confirm |
| `create_gift` | `wishlist_id`, `name`, `price_min?`, `price_max?`, `url?`, `note?`, `image_urls?` | Created `Gift` |
| `update_gift` | `id`, fields… | Updated `Gift` |
| `delete_gift` | `id`, `confirm: true` | `{ deleted: true, id }` — destructive |
| `add_gift_from_url` | `wishlist_id`, `url` | Created `Gift` — POSTs to `/api/extract`, then creates gift from the extracted data |

Destructive tools (`delete_*`) require `confirm: true` in the input. Omitting it returns a dry-run summary of what would be deleted — an explicit safety rail so an agent that hallucinates an ID doesn't destroy user data.

**Deferred from V1:** sharing tools (create/rotate/revoke share links), reorder gifts, profile, booking, subscription. Sharing is deferred specifically because its destructive ops (rotating or revoking a share token) break existing shared links with no rollback; that needs a dedicated agent-confirmation UX design pass.

### Authentication

Reuses the OAuth 2.0 Device Authorization Grant flow (RFC 8628). The three endpoints:

- `POST /api/auth/device` — issue `device_code` + `user_code` + `verification_uri`
- `POST /api/auth/device/token` — poll for tokens once user approves
- `GET /auth/device` — web page where the user signs in and approves

`forme-mcp auth` calls `/api/auth/device`, opens `verification_uri` in the user's default browser, then polls `/api/auth/device/token` until approval or timeout. On success, writes access + refresh tokens to disk.

**Credential storage:**

| OS | Path | Permissions |
|---|---|---|
| macOS / Linux | `~/.config/forme/credentials.json` (honors `$XDG_CONFIG_HOME`) | `chmod 600` |
| Windows | `%APPDATA%\forme\credentials.json` | User-only ACL (default on Windows for `%APPDATA%`) |

File contents:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_at": "2026-04-20T12:34:56.000Z",
  "email": "user@example.com"
}
```

**Refresh strategy:**
- Before each MCP tool call, check `expires_at`. If within 60 s of expiry (or past), refresh via Supabase before making the call.
- If refresh itself returns 400/401 (refresh token revoked or expired), tools return a structured error: `"Your session has ended. Run \`npx @formegifts/mcp auth\` to sign in again."`
- No attempt to proactively refresh in the background — the server is short-lived per host connection and reactive refresh on the critical path is simpler than a timer.

### API transport

Two paths, chosen per tool:

| Path | Used by | Why |
|---|---|---|
| **supabase-js direct** (with user's access token) | All CRUD tools (`list_*`, `get_*`, `create_*`, `update_*`, `delete_*`) | RLS already enforces access control per the project's database-first architecture. No new backend endpoints needed. Duplicates ~200 LOC of thin `.from().select()` calls from the web app, but avoids refactoring the browser-oriented web code to accept a server-side client instance. |
| **HTTP POST** to `https://forme.gifts/api/extract` with Bearer token | `add_gift_from_url` only | That endpoint requires backend-only Gemini credentials; it cannot be called from a user-context client. Two-step: POST URL → receive parsed product JSON → then call `create_gift` path internally to persist. |

The supabase-js client is instantiated per tool call with the user's current access token (Authorization header). Anon key + project URL are compile-time constants in the package (public values — the web app exposes them too).

### Error model

Inputs validated with Zod at the tool boundary; invalid shapes return MCP `invalid_params` with the Zod issue list.

Runtime errors map to MCP error codes as follows:

| Cause | MCP code | Example user-facing message |
|---|---|---|
| Missing / unrecoverable credentials | `unauthenticated` | "Run `npx @formegifts/mcp auth` to sign in." |
| RLS denied / 403 | `permission_denied` | "You don't have access to that wishlist." |
| `/api/extract` 402 (tier gated) | `failed_precondition` | "URL extraction requires Plus. Visit forme.gifts/billing to upgrade." |
| `/api/extract` or device-flow 429 | `resource_exhausted` | "Rate limited — try again in N seconds." |
| PGRST validation | `invalid_argument` | Supabase's human-readable reason |
| Network / timeout | `unavailable` | "Couldn't reach forme.gifts. Check your connection and try again." |
| Destructive op missing `confirm` | `failed_precondition` | `"Would delete wishlist \"Kitchen\" (12 gifts). Pass \`confirm: true\` to proceed."` |

All errors include a `retryable: boolean` hint in their structured content so agents can decide whether to re-invoke.

### Distribution

**Ship on day 1:**

1. **npm package `@formegifts/mcp`** — primary install path. Published from CI on this repo. Node 24+, ESM build.
2. **`forme.gifts/mcp` route** — marketing + install page. Deep-link install buttons for each major host:

   | Host | Install method |
   |---|---|
   | Claude Code | Copy-paste: `claude mcp add --scope user forme -- npx -y @formegifts/mcp` |
   | Claude Desktop | Copy-paste JSON snippet into `claude_desktop_config.json` |
   | Cursor | Deep-link URL: `cursor://anysphere.cursor-deeplink/mcp/install?name=forme&config=...` |
   | VSCode | Deep-link URL: `vscode:mcp/install?...` |

   Plus a fallback "manual setup" section with the raw npx invocation for any MCP host not listed.
3. **Settings → Integrations** link in the app, pointing to `forme.gifts/mcp`.
4. **npm README** mirrors the install snippets; links back to `forme.gifts/mcp` for richer content.

**Deferred to future work:**

- Homebrew formula (standalone bun-compiled binary for users without Node)
- Remote hosted MCP at `mcp.forme.gifts` (HTTP + SSE transport, browser OAuth, zero-install) — biggest UX win but requires hosting infrastructure that speaks the MCP protocol
- DXT (Claude Desktop Extension) bundle — strictly narrower reach than npx

**package.json metadata:**

- `homepage: "https://forme.gifts/mcp"` — always set
- `repository` — points at this GitHub repo so npm displays a working source link and provenance attestation can verify
- `bugs: { url, email }` — GitHub issues + feedback email
- License: `UNLICENSED` (proprietary; use restricted to the forme.gifts service)

### Testing

Three layers:

1. **Unit tests** (`test/tools/*.test.ts`) — one per tool. Mock supabase-js; assert Zod validation, error mapping, and output shape.
2. **Integration tests** (`test/integration/*.test.ts`) — bring up local Supabase (`supabase start`), run real device-flow happy path against it, call each tool against the real local DB, teardown. Run in CI against a fresh supabase instance.
3. **Manual smoke test** — install in Claude Code locally via `claude mcp add forme -- node /path/to/dist/bin.js` (or the published package), exercise each tool interactively. Done before every release.

No tests mock the MCP protocol layer itself — we trust `@modelcontextprotocol/sdk`. Tests hit the tool handler functions directly.

## Scope

### In (V1)

- `@formegifts/mcp` npm package with stdio server + auth CLI subcommands
- 9 tools as specified above
- Device-flow auth reusing the web app's existing endpoints
- Supabase-direct transport for CRUD, HTTP for extract
- `forme.gifts/mcp` marketing/install page with per-host deep links
- Unit + integration + manual smoke tests

### Out (follow-up work)

- Full human CLI (`@formegifts/cli` — `forme add`, `forme list`, pretty tables, pickers)
- Sharing tools (create / rotate / revoke share links)
- Reorder gifts, profile, booking, subscription tools
- Remote hosted MCP at `mcp.forme.gifts`
- Homebrew formula + standalone binaries
- DXT bundle for Claude Desktop
- Offline command queue with sync-on-reconnect
- MCP prompts and resources (beyond tools)

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Zod schema drift between web app and vendored copy | Integration tests insert/update/select real rows per tool; a drift fails CI loudly. If sync burden grows, extract to a shared `@formegifts/schemas` npm package (deferred). |
| Agents call destructive tools on hallucinated IDs | `confirm: true` requirement on all `delete_*` tools; dry-run preview when missing |
| Credential file readable by other processes | `chmod 600` + XDG paths; explicit test that file is created with correct permissions |
| Refresh token revoked mid-session | Reactive refresh + clear error message pointing to `auth` subcommand |
| `add_gift_from_url` latency (Gemini hop) makes agents time out | Streaming progress unnecessary for MCP; ensure `/api/extract` stays under 10s p95 |
| Host-specific deep-link format drift | Config snippets + raw npx command always work as fallback; deep-links are a convenience not a requirement |

## Build Order

Phased so each phase delivers something testable.

| Phase | Scope | Validation |
|---|---|---|
| **0. Repo provisioning** | Init with `bun init`, add TS config, testing (Vitest), CI skeleton. | Empty repo builds and tests cleanly on CI. |
| **1. Package scaffold + auth CLI** | `bin.ts`, device-flow client, credential storage, `auth` / `auth logout` / `whoami` subcommands. Vendor Zod schemas. No MCP server yet. | `npx @formegifts/mcp auth` completes device flow against local Supabase and writes a readable credentials file. `whoami` reads it back. |
| **2. MCP server + read-only tools** | `list_wishlists`, `get_wishlist`. supabase-js client factory with access-token refresh. Zod input validation, error mapping. | `claude mcp add` locally, invoke both tools via Claude Code, see real data. |
| **3. Write tools** | `create_wishlist`, `update_wishlist`, `delete_wishlist`, `create_gift`, `update_gift`, `delete_gift`. `confirm: true` on deletes. | Round-trip: agent creates wishlist, adds gifts, edits, deletes. Verify data in Supabase. |
| **4. `add_gift_from_url`** | HTTP client for `/api/extract`, tool wiring, tier-gated error mapping. | Agent adds gift from a real Etsy URL end-to-end. Free-tier user sees upgrade error. |
| **5. Distribution** | CI publish workflow, `forme.gifts/mcp` route with install buttons, Settings → Integrations link, npm README. | Fresh user installs via Claude Code deep-link, runs `auth`, adds a gift. |

Phases 1–4 are sequential. Phase 5 can run in parallel with phase 4. Phase 0 gates everything.
