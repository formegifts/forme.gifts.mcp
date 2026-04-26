import type { SupabaseClient } from '@supabase/supabase-js'
import { refreshIfNeeded as defaultRefreshIfNeeded, SessionEndedError } from '../auth/refresh'
import { McpToolError, mapSupabaseError, type ToolErrorCode } from '../errors'
import { createAuthedSupabaseClient as defaultCreateClient } from '../supabase'

export type ToolContext = { client: SupabaseClient }
export type ToolHandler<I, O> = (input: I, ctx: ToolContext) => Promise<O>

export type WithAuthDeps = {
  refreshIfNeeded: () => Promise<string>
  createClient: (accessToken: string) => SupabaseClient
}

const defaultDeps: WithAuthDeps = {
  refreshIfNeeded: defaultRefreshIfNeeded,
  createClient: defaultCreateClient,
}

type ToolErrorPayload = { code: ToolErrorCode; message: string; retryable: boolean }
export type CallToolResult<O> = {
  content: Array<{ type: 'text'; text: string }>
  structuredContent?: O | ToolErrorPayload
  isError?: boolean
}

const toolError = <O>(payload: ToolErrorPayload): CallToolResult<O> => ({
  content: [{ type: 'text', text: JSON.stringify(payload) }],
  structuredContent: payload,
  isError: true,
})

export const withAuth =
  <I, O>(
    handler: ToolHandler<I, O>,
    deps: WithAuthDeps = defaultDeps
  ): ((input: I) => Promise<CallToolResult<O>>) =>
  async (input: I): Promise<CallToolResult<O>> => {
    let token: string
    try {
      token = await deps.refreshIfNeeded()
    } catch (err) {
      if (err instanceof SessionEndedError) {
        return toolError({ code: 'unauthenticated', message: err.message, retryable: false })
      }
      const mapped = mapSupabaseError(err)
      return toolError({ code: mapped.code, message: mapped.message, retryable: mapped.retryable })
    }

    try {
      const client = deps.createClient(token)
      const result = await handler(input, { client })
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result,
      }
    } catch (err) {
      const mapped = err instanceof McpToolError ? err : mapSupabaseError(err)
      return toolError({ code: mapped.code, message: mapped.message, retryable: mapped.retryable })
    }
  }
