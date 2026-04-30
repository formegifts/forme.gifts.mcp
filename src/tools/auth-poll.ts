import { z } from 'zod'
import { type Credentials, writeCredentials as defaultWriteCredentials } from '../auth/credentials'
import { decodeEmailFromJwt } from '../auth/decode-email'
import { pollDeviceCode as defaultPollDeviceCode, type PollResult } from '../auth/device-flow'
import { McpToolError } from '../errors'

export const authPollInput = z.object({ device_code: z.string().min(1) }).strict()
export type AuthPollInput = z.infer<typeof authPollInput>

export type AuthPollOutput =
  | { status: 'signed_in'; email: string }
  | { status: 'pending' }
  | { status: 'expired' }

export type AuthPollDeps = {
  pollDeviceCode: (deviceCode: string) => Promise<PollResult>
  writeCredentials: (c: Credentials) => Promise<void>
  sleep: (ms: number) => Promise<void>
  now: () => number
}

// 45s ceiling keeps us safely under typical MCP client request timeouts.
const POLL_TIMEOUT_MS = 45 * 1000
const POLL_INTERVAL_MS = 5 * 1000

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const defaultDeps: AuthPollDeps = {
  pollDeviceCode: defaultPollDeviceCode,
  writeCredentials: defaultWriteCredentials,
  sleep: defaultSleep,
  now: () => Date.now(),
}

export const authPoll = async (
  input: AuthPollInput,
  deps: AuthPollDeps = defaultDeps
): Promise<AuthPollOutput> => {
  const deadline = deps.now() + POLL_TIMEOUT_MS
  let intervalMs = POLL_INTERVAL_MS

  while (deps.now() < deadline) {
    const result = await deps.pollDeviceCode(input.device_code)

    if (result.status === 'approved') {
      const email = decodeEmailFromJwt(result.tokens.access_token)
      if (!email) {
        throw new McpToolError(
          'failed_precondition',
          'Could not decode email from access token.',
          false
        )
      }
      await deps.writeCredentials({
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
        expires_at: new Date(deps.now() + result.tokens.expires_in * 1000).toISOString(),
        email,
      })
      return { status: 'signed_in', email }
    }
    if (result.status === 'expired') return { status: 'expired' }
    if (result.status === 'slow_down') intervalMs *= 2
    await deps.sleep(intervalMs)
  }
  return { status: 'pending' }
}
