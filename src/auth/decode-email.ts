export const decodeEmailFromJwt = (jwt: string): string | null => {
  const parts = jwt.split('.')
  if (parts.length !== 3) return null
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8')
    const payload = JSON.parse(json) as { email?: unknown }
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}
