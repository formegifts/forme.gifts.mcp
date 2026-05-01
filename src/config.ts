export const API_BASE = process.env.FORME_API_BASE ?? 'https://forme.gifts'
export const SUPABASE_URL =
  process.env.FORME_SUPABASE_URL ?? 'https://fybvorxzkuyytvpjqgzv.supabase.co'
// Public anon key — same value the web app ships in its production client bundle.
export const SUPABASE_ANON_KEY =
  process.env.FORME_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5YnZvcnh6a3V5eXR2cGpxZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTAxMjksImV4cCI6MjA4OTE4NjEyOX0.6sa4R9SHUhtE0n9mPOj4MW7o9fThgfjjr-Cn24pxckU'

export const DEVICE_FLOW_MIN_POLL_INTERVAL_SECONDS = 5
export const DEVICE_FLOW_TIMEOUT_SECONDS = 600

export const SERVER_NAME = 'formegifts'
export const SERVER_VERSION = __SERVER_VERSION__
