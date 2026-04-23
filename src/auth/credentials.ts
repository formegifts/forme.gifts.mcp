import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir, platform } from 'node:os'
import { dirname, join } from 'node:path'

export type Credentials = {
  access_token: string
  refresh_token: string
  expires_at: string
  email: string
}

export const credentialsPath = (): string => {
  if (platform() === 'win32') {
    const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming')
    return join(appData, 'forme', 'credentials.json')
  }
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config')
  return join(base, 'forme', 'credentials.json')
}

export const writeCredentials = async (creds: Credentials): Promise<void> => {
  const path = credentialsPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(creds, null, 2), { encoding: 'utf8', mode: 0o600 })
  if (platform() !== 'win32') await chmod(path, 0o600)
}

export const readCredentials = async (): Promise<Credentials | null> => {
  try {
    const raw = await readFile(credentialsPath(), 'utf8')
    return JSON.parse(raw) as Credentials
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

export const deleteCredentials = async (): Promise<void> => {
  await rm(credentialsPath(), { force: true })
}
