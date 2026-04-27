export const PLACEHOLDER_ANON_KEY = 'REPLACE_WITH_PUBLISHED_ANON_KEY'

export const API_BASE = process.env.FORME_API_BASE ?? 'https://forme.gifts'
export const SUPABASE_URL =
  process.env.FORME_SUPABASE_URL ?? 'https://fybvorxzkuyytvpjqgzv.supabase.co'
export const SUPABASE_ANON_KEY =
  process.env.FORME_SUPABASE_ANON_KEY ??
  // Public anon key — same value the web app ships in its client bundle.
  // TODO: replace with the real published anon key before Phase 5.
  PLACEHOLDER_ANON_KEY

export const DEVICE_FLOW_MIN_POLL_INTERVAL_SECONDS = 5
export const DEVICE_FLOW_TIMEOUT_SECONDS = 600

export const SERVER_NAME = 'formegifts'
export const SERVER_VERSION = '0.1.0'

export const assertServerConfig = (anonKey: string = SUPABASE_ANON_KEY): void => {
  if (anonKey === PLACEHOLDER_ANON_KEY) {
    throw new Error(
      'FORME_SUPABASE_ANON_KEY is unset. Pass it via --env when registering the MCP server (see docs/phase-2-smoke.md).'
    )
  }
}
