# @formegifts/mcp

MCP (Model Context Protocol) stdio server + auth CLI for the forme.gifts wishlist app.

## Design

Canonical design source: see `docs/design.md`.

## Sibling Checkout

The web app source lives at `../forme.gifts/`. Zod schemas are vendored from there:
- Source: `../forme.gifts/src/lib/schemas/`
- Destination: `src/schemas/`

## Beads Context

Ticket `forme-k6u` lives in the forme.gifts workspace. Use `bd` commands there:
```sh
cd ../forme.gifts
bd show forme-k6u
```

## Conventions

- Arrow functions only; no `function` keyword
- Strict TypeScript
- Comments for non-obvious "why" only — code is self-documenting
- Small, focused functions

## Build & Test

- **Build:** bun
- **Test:** vitest
- **Lint & format:** biome
