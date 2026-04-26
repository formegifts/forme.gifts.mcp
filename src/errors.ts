export type ToolErrorCode =
  | 'unauthenticated'
  | 'permission_denied'
  | 'failed_precondition'
  | 'resource_exhausted'
  | 'invalid_argument'
  | 'unavailable'

export class McpToolError extends Error {
  readonly code: ToolErrorCode
  readonly retryable: boolean

  constructor(code: ToolErrorCode, message: string, retryable: boolean) {
    super(message)
    this.name = 'McpToolError'
    this.code = code
    this.retryable = retryable
  }
}

type SupabaseLikeError = {
  code?: string
  status?: number
  message?: string
}

export const mapSupabaseError = (err: unknown): McpToolError => {
  if (err instanceof McpToolError) return err
  const e = (err ?? {}) as SupabaseLikeError
  const msg = e.message ?? 'Unknown error'

  if (e.status === 401) return new McpToolError('unauthenticated', msg, false)
  if (e.code === '42501') return new McpToolError('permission_denied', msg, false)
  if (e.code === 'PGRST116') return new McpToolError('invalid_argument', msg, false)
  if (e.code === '23502' || e.code === '23514')
    return new McpToolError('invalid_argument', msg, false)
  if (msg.toLowerCase().includes('fetch failed') || msg.toLowerCase().includes('network')) {
    return new McpToolError('unavailable', msg, true)
  }
  return new McpToolError('unavailable', msg, true)
}
