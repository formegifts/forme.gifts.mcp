export type ToolErrorCode =
  | 'unauthenticated'
  | 'permission_denied'
  | 'failed_precondition'
  | 'resource_exhausted'
  | 'invalid_argument'
  | 'unavailable'

export const SESSION_ENDED_MESSAGE =
  'Your session has ended. Call the `auth_start` tool to sign in again, or run `formegifts-mcp auth` from a terminal.'

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

const PG_INSUFFICIENT_PRIVILEGE = '42501'
const PG_NOT_NULL_VIOLATION = '23502'
const PG_CHECK_VIOLATION = '23514'
const PG_RAISE_EXCEPTION = 'P0001'
const PG_CONFIG_LIMIT_EXCEEDED = '53400'
const PGRST_NO_ROWS = 'PGRST116'

const isInvalidApiKey = (e: SupabaseLikeError, lowerMsg: string): boolean =>
  e.code === 'invalid_api_key' || lowerMsg.includes('invalid api key')

// Cached session is unusable (rotated signing key, expired/malformed JWT) — surface re-auth UX,
// not the retryable+opaque default. Word-boundaries on jwt/jws avoid false positives.
const JWT_FAILURE_PATTERN = /\bjw[st]\b|suitable key|wrong key type/
const isJwtVerificationFailure = (lowerMsg: string): boolean => JWT_FAILURE_PATTERN.test(lowerMsg)

export const mapSupabaseError = (err: unknown): McpToolError => {
  if (err instanceof McpToolError) return err
  const e = (err ?? {}) as SupabaseLikeError
  const msg = e.message ?? 'Unknown error'
  const lowerMsg = msg.toLowerCase()

  if (isInvalidApiKey(e, lowerMsg)) {
    return new McpToolError(
      'failed_precondition',
      'Server is misconfigured: FORME_SUPABASE_ANON_KEY is missing or wrong. Re-register the MCP server with the correct anon key.',
      false
    )
  }
  if (isJwtVerificationFailure(lowerMsg))
    return new McpToolError('unauthenticated', SESSION_ENDED_MESSAGE, false)
  // JWT-bearing 401s are folded into re-auth UX above; this catches non-JWT 401s.
  if (e.status === 401) return new McpToolError('unauthenticated', msg, false)
  if (e.code === PG_INSUFFICIENT_PRIVILEGE) return new McpToolError('permission_denied', msg, false)
  if (e.code === PGRST_NO_ROWS) return new McpToolError('invalid_argument', msg, false)
  if (e.code === PG_NOT_NULL_VIOLATION || e.code === PG_CHECK_VIOLATION)
    return new McpToolError('invalid_argument', msg, false)
  if (e.code === PG_CONFIG_LIMIT_EXCEEDED) return new McpToolError('resource_exhausted', msg, false)
  if (e.code === PG_RAISE_EXCEPTION) return new McpToolError('failed_precondition', msg, false)
  return new McpToolError('unavailable', msg, true)
}
