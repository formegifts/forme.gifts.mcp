import { spawn } from 'node:child_process'
import { platform } from 'node:os'

export const openBrowser = (url: string): void => {
  const [cmd, args] =
    platform() === 'darwin'
      ? (['open', [url]] as const)
      : platform() === 'win32'
        ? (['cmd', ['/c', 'start', '', url]] as const)
        : (['xdg-open', [url]] as const)
  const child = spawn(cmd, args as string[], { stdio: 'ignore', detached: true })
  child.unref()
}
