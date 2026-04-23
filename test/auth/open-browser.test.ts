import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({ unref: vi.fn() })),
}))

describe('openBrowser', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('spawns "open" on macOS', async () => {
    vi.doMock('node:os', () => ({ platform: () => 'darwin' }))
    const { spawn } = await import('node:child_process')
    const { openBrowser } = await import('../../src/auth/open-browser')
    openBrowser('https://example.com')
    expect(spawn).toHaveBeenCalledWith('open', ['https://example.com'], { stdio: 'ignore', detached: true })
  })

  it('spawns "xdg-open" on linux', async () => {
    vi.doMock('node:os', () => ({ platform: () => 'linux' }))
    const { spawn } = await import('node:child_process')
    const { openBrowser } = await import('../../src/auth/open-browser')
    openBrowser('https://example.com')
    expect(spawn).toHaveBeenCalledWith('xdg-open', ['https://example.com'], { stdio: 'ignore', detached: true })
  })

  it('spawns "cmd /c start" on windows', async () => {
    vi.doMock('node:os', () => ({ platform: () => 'win32' }))
    const { spawn } = await import('node:child_process')
    const { openBrowser } = await import('../../src/auth/open-browser')
    openBrowser('https://example.com')
    expect(spawn).toHaveBeenCalledWith('cmd', ['/c', 'start', '', 'https://example.com'], {
      stdio: 'ignore',
      detached: true,
    })
  })
})
