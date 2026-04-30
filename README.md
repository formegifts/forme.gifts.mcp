# @formegifts/mcp

MCP server for the forme.gifts wishlist app — manage wishlists and gifts from Claude Code, Claude Desktop, Cursor, and other MCP clients.

## Install

**Claude Code:**
```sh
claude mcp add --scope user forme -- npx -y @formegifts/mcp
```

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "forme": {
      "command": "npx",
      "args": ["-y", "@formegifts/mcp"]
    }
  }
}
```

**Cursor** — add to MCP config:
```json
{
  "mcpServers": {
    "forme": {
      "command": "npx",
      "args": ["-y", "@formegifts/mcp"]
    }
  }
}
```

**Any MCP host:**
```sh
npx -y @formegifts/mcp
```

> Install links for each host will be added in a future release. See [forme.gifts/mcp](https://forme.gifts/mcp) for the latest.

## Authentication

The first time you use any tool, the server will return an `unauthenticated` error pointing at the `auth_start` tool. Just ask your MCP host (Claude Code, Claude Desktop, Cursor, …) to sign you in — it will call `auth_start`, show you a verification URL and short code, and complete the sign-in via `auth_poll` after you approve in your browser.

If you'd rather sign in from a terminal (handy for CI or pre-warming credentials):
```sh
npx @formegifts/mcp auth
```

If installed globally (`npm install -g @formegifts/mcp`), use `formegifts-mcp` directly (`forme-mcp` is a legacy alias that also works):
```sh
formegifts-mcp auth
```

## Source

Source: [github.com/formegifts/forme.gifts.mcp](https://github.com/formegifts/forme.gifts.mcp). Licensed for use with the forme.gifts service — see [LICENSE](./LICENSE). Questions or feedback: feedback@forme.gifts
