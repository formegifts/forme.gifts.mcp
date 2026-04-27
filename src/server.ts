import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { assertServerConfig, SERVER_NAME, SERVER_VERSION } from './config'
import { registerAllTools } from './tools'

export const runServer = async (): Promise<void> => {
  assertServerConfig()
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION })
  registerAllTools(server)
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
