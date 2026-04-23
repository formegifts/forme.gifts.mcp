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

After installing, sign in once:
```sh
npx @formegifts/mcp auth
```

## Source

This package is closed-source by design. The source is auditable after install at `node_modules/@formegifts/mcp`. Questions or feedback: feedback@forme.gifts
