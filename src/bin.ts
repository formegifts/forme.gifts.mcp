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
  log('Usage: forme-mcp [serve|auth|auth logout|whoami]')
  exit(2)
}

const isMain = import.meta.url === `file://${process.argv[1]}`
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
