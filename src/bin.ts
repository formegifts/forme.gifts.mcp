import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { runAuth, runLogout, runWhoami } from './auth/cli'
import { runServer } from './server'

export type DispatchDeps = {
  runAuth: () => Promise<void>
  runLogout: () => Promise<void>
  runWhoami: () => Promise<void>
  runServer: () => Promise<void>
  log?: (msg: string) => void
  exit?: (code: number) => void
}

export const dispatch = async (argv: string[], deps: DispatchDeps): Promise<void> => {
  const log = deps.log ?? ((m: string) => console.log(m))
  const exit =
    deps.exit ??
    ((c: number) => {
      process.exitCode = c
    })
  const [cmd, sub] = argv
  if (!cmd || cmd === 'serve') return deps.runServer()
  if (cmd === 'auth' && !sub) return deps.runAuth()
  if (cmd === 'auth' && sub === 'logout') return deps.runLogout()
  if (cmd === 'whoami') return deps.runWhoami()
  log('Usage: formegifts-mcp [serve|auth|auth logout|whoami]')
  exit(2)
}

// Symlink-safe main detection: npm bin is a symlink, so we resolve before comparing.
const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
if (isMain) {
  dispatch(process.argv.slice(2), {
    runAuth,
    runLogout,
    runWhoami,
    runServer,
  }).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  })
}
