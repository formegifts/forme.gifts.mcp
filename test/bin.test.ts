import { describe, expect, it, vi } from 'vitest'
import { dispatch } from '../src/bin'

describe('dispatch', () => {
  it('calls runAuth for "auth"', async () => {
    const runAuth = vi.fn(async () => {})
    const runLogout = vi.fn(async () => {})
    const runWhoami = vi.fn(async () => {})
    const runServer = vi.fn(async () => {})
    await dispatch(['auth'], { runAuth, runLogout, runWhoami, runServer })
    expect(runAuth).toHaveBeenCalledOnce()
  })

  it('calls runLogout for "auth logout"', async () => {
    const runAuth = vi.fn(async () => {})
    const runLogout = vi.fn(async () => {})
    const runWhoami = vi.fn(async () => {})
    const runServer = vi.fn(async () => {})
    await dispatch(['auth', 'logout'], { runAuth, runLogout, runWhoami, runServer })
    expect(runLogout).toHaveBeenCalledOnce()
  })

  it('calls runWhoami for "whoami"', async () => {
    const runAuth = vi.fn(async () => {})
    const runLogout = vi.fn(async () => {})
    const runWhoami = vi.fn(async () => {})
    const runServer = vi.fn(async () => {})
    await dispatch(['whoami'], { runAuth, runLogout, runWhoami, runServer })
    expect(runWhoami).toHaveBeenCalledOnce()
  })

  it('calls runServer with no args', async () => {
    const runAuth = vi.fn(async () => {})
    const runLogout = vi.fn(async () => {})
    const runWhoami = vi.fn(async () => {})
    const runServer = vi.fn(async () => {})
    await dispatch([], { runAuth, runLogout, runWhoami, runServer })
    expect(runServer).toHaveBeenCalledOnce()
  })

  it('calls runServer for "serve"', async () => {
    const runAuth = vi.fn(async () => {})
    const runLogout = vi.fn(async () => {})
    const runWhoami = vi.fn(async () => {})
    const runServer = vi.fn(async () => {})
    await dispatch(['serve'], { runAuth, runLogout, runWhoami, runServer })
    expect(runServer).toHaveBeenCalledOnce()
  })

  it('exits with code 2 and prints usage for unknown command', async () => {
    const log = vi.fn()
    const exit = vi.fn()
    const runAuth = vi.fn(async () => {})
    const runLogout = vi.fn(async () => {})
    const runWhoami = vi.fn(async () => {})
    const runServer = vi.fn(async () => {})
    await dispatch(['nope'], { runAuth, runLogout, runWhoami, runServer, log, exit })
    expect(exit).toHaveBeenCalledWith(2)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Usage'))
  })
})
