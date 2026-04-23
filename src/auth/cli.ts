import type { Credentials } from './credentials'
import {
  deleteCredentials as defaultDeleteCredentials,
  readCredentials as defaultReadCredentials,
  writeCredentials as defaultWriteCredentials,
} from './credentials'
import { decodeEmailFromJwt } from './decode-email'
import type { DeviceCodeResponse, PollResult } from './device-flow'
import {
  issueDeviceCode as defaultIssueDeviceCode,
  pollDeviceCode as defaultPollDeviceCode,
} from './device-flow'
import { openBrowser as defaultOpenBrowser } from './open-browser'

export type AuthDeps = {
  issueDeviceCode: () => Promise<DeviceCodeResponse>
  pollDeviceCode: (code: string) => Promise<PollResult>
  openBrowser: (url: string) => void
  writeCredentials: (c: Credentials) => Promise<void>
  sleep: (ms: number) => Promise<void>
  log: (msg: string) => void
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const defaultAuthDeps: AuthDeps = {
  issueDeviceCode: defaultIssueDeviceCode,
  pollDeviceCode: defaultPollDeviceCode,
  openBrowser: defaultOpenBrowser,
  writeCredentials: defaultWriteCredentials,
  sleep: defaultSleep,
  log: (msg: string) => console.log(msg),
}

export const runAuth = async (deps: AuthDeps = defaultAuthDeps): Promise<void> => {
  const issued = await deps.issueDeviceCode()
  deps.log(`To sign in, open: ${issued.verification_url}`)
  deps.log(`Your code: ${issued.user_code}`)
  deps.log('')
  deps.log('Opening your browser...')
  try {
    deps.openBrowser(issued.verification_url)
  } catch {}

  let intervalMs = issued.interval * 1000
  const deadline = Date.now() + issued.expires_in * 1000

  while (Date.now() < deadline) {
    await deps.sleep(intervalMs)
    const result = await deps.pollDeviceCode(issued.device_code)

    if (result.status === 'approved') {
      const email = decodeEmailFromJwt(result.tokens.access_token)
      if (!email) throw new Error('Could not decode email from access token')
      await deps.writeCredentials({
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
        expires_at: new Date(Date.now() + result.tokens.expires_in * 1000).toISOString(),
        email,
      })
      deps.log(`Signed in as ${email}.`)
      return
    }
    if (result.status === 'slow_down') intervalMs *= 2
  }
  throw new Error('Authentication timed out — run `forme-mcp auth` again.')
}

export const runLogout = async (
  deleteCreds: () => Promise<void> = defaultDeleteCredentials,
  log: (msg: string) => void = console.log
): Promise<void> => {
  await deleteCreds()
  log('Signed out.')
}

export const runWhoami = async (
  readCreds: () => Promise<Credentials | null> = defaultReadCredentials,
  log: (msg: string) => void = console.log
): Promise<void> => {
  const creds = await readCreds()
  if (!creds) {
    log('Not signed in. Run `forme-mcp auth` to sign in.')
    process.exitCode = 1
    return
  }
  log(creds.email)
}
