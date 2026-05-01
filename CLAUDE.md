# @formegifts/mcp

MCP (Model Context Protocol) stdio server + auth CLI for the forme.gifts wishlist app.

## Design

Canonical design source: see `docs/design.md`.

## Conventions

- Arrow functions only; no `function` keyword
- Strict TypeScript
- Comments for non-obvious "why" only — code is self-documenting
- Small, focused functions

## Build & Test

- **Build:** bun
- **Test:** vitest
- **Lint & format:** biome

## Releasing

Publishing to npm is fully automated via `.github/workflows/release.yml` — **never run `npm publish` manually**.

Steps:
1. Bump `version` in `package.json`
2. Add a `CHANGELOG.md` entry
3. Commit and push the changes
4. Push the tag — this triggers the release workflow

```sh
git tag v1.2.3
git push origin main
git push origin v1.2.3
```

The workflow builds, runs `npm publish --provenance`, and attaches a build attestation. Requires `NPM_TOKEN` secret set in GitHub repo settings (granular token scoped to `@formegifts/mcp`).
