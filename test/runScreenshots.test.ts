import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { type BrowserLike, type LaunchOptions, type PageLike, runScreenshots } from '../src/runScreenshots'
import type WebScreenshot from '../src/types/WebScreenshot'

function job(overrides: Partial<WebScreenshot> = {}): WebScreenshot {
  return {
    url: 'https://example.com',
    time: 3000,
    x: 10,
    y: 20,
    width: 700,
    height: 180,
    path: 'out',
    tmp: 'out_tmp',
    ext: 'png',
    crop: false,
    waitTimeout: 30000,
    ...overrides,
  }
}

function createFakeBrowser(calls: {
  launch?: LaunchOptions
  goto?: unknown[]
  screenshot?: unknown[]
  authenticate?: unknown[]
  setCookie?: unknown[]
  waitForSelector?: unknown[]
  viewport?: unknown
  waits?: number[]
}): BrowserLike {
  const page: PageLike = {
    async authenticate(credentials) {
      calls.authenticate = calls.authenticate ?? []
      calls.authenticate.push(credentials)
    },
    async setCookie(...cookies) {
      calls.setCookie = calls.setCookie ?? []
      calls.setCookie.push(...cookies)
    },
    async setViewport(viewport) {
      calls.viewport = viewport
    },
    async goto(url, options) {
      calls.goto = calls.goto ?? []
      calls.goto.push({ url, options })
    },
    async waitForSelector(selector, options) {
      calls.waitForSelector = calls.waitForSelector ?? []
      calls.waitForSelector.push({ selector, options })
    },
    async screenshot(options) {
      calls.screenshot = calls.screenshot ?? []
      calls.screenshot.push(options)
    },
    async close() {},
  }

  return {
    async newPage() {
      return page
    },
    async close() {},
  }
}

describe('runScreenshots', () => {
  it('waits for networkidle2 then the extra -t delay, and clips by default', async () => {
    const calls: {
      launch?: LaunchOptions
      goto?: unknown[]
      screenshot?: unknown[]
      viewport?: unknown
      waits?: number[]
    } = {}
    const waits: number[] = []
    const renamed: Array<[string, string]> = []

    await runScreenshots([job()], {
      launch: async (options) => {
        calls.launch = options
        return createFakeBrowser(calls)
      },
      sleep: async (ms) => {
        waits.push(ms)
      },
      fs: {
        renameSync: (src, dest) => {
          renamed.push([src, dest])
        },
        unlinkSync: () => {
          throw new Error('unlink should not run without --crop')
        },
      },
    })

    assert.deepEqual(calls.launch, { headless: 'shell', args: ['--no-sandbox'] })
    assert.deepEqual(calls.viewport, { width: 1920, height: 1080 })
    assert.deepEqual(calls.goto, [{ url: 'https://example.com', options: { waitUntil: 'networkidle2' } }])
    assert.deepEqual(waits, [3000])
    assert.deepEqual(calls.screenshot, [{ path: 'out_tmp.png', clip: { x: 10, y: 20, width: 700, height: 180 } }])
    assert.deepEqual(renamed, [['out_tmp.png', 'out.png']])
  })

  it('takes a full-page screenshot when width or height is 0', async () => {
    const calls: { screenshot?: unknown[] } = {}

    await runScreenshots([job({ width: 0, height: 1080 })], {
      launch: async () => createFakeBrowser(calls),
      sleep: async () => {},
      fs: {
        renameSync: () => {},
        unlinkSync: () => {},
      },
    })

    assert.deepEqual(calls.screenshot, [{ path: 'out_tmp.png', fullPage: true }])
  })

  it('authenticates, crops via trimToFile, and passes a chrome path through', async () => {
    const calls: { launch?: LaunchOptions; authenticate?: unknown[] } = {}
    const trimmed: Array<[string, string]> = []
    const unlinked: string[] = []

    await runScreenshots([job({ auth: 'user:pass', crop: true })], {
      debug: true,
      chromePath: '/usr/bin/google-chrome',
      launch: async (options) => {
        calls.launch = options
        return createFakeBrowser(calls)
      },
      sleep: async () => {},
      trimToFile: async (input, output) => {
        trimmed.push([input, output])
      },
      fs: {
        renameSync: () => {
          throw new Error('rename should not run with --crop')
        },
        unlinkSync: (path) => {
          unlinked.push(path)
        },
      },
    })

    assert.deepEqual(calls.launch, {
      headless: false,
      args: ['--no-sandbox'],
      executablePath: '/usr/bin/google-chrome',
    })
    assert.deepEqual(calls.authenticate, [{ username: 'user', password: 'pass' }])
    assert.deepEqual(trimmed, [['out_tmp.png', 'out.png']])
    assert.deepEqual(unlinked, ['out_tmp.png'])
  })

  it('waits for a CSS selector after navigation, then the extra -t delay', async () => {
    const calls: { goto?: unknown[]; waitForSelector?: unknown[] } = {}
    const waits: number[] = []

    await runScreenshots([job({ waitFor: '#dashboard', waitTimeout: 30000, time: 2000 })], {
      launch: async () => createFakeBrowser(calls),
      sleep: async (ms) => {
        waits.push(ms)
      },
      fs: {
        renameSync: () => {},
        unlinkSync: () => {},
      },
    })

    assert.deepEqual(calls.goto, [{ url: 'https://example.com', options: { waitUntil: 'networkidle2' } }])
    assert.deepEqual(calls.waitForSelector, [{ selector: '#dashboard', options: { timeout: 30000 } }])
    assert.deepEqual(waits, [2000])
  })

  it('does not call waitForSelector when no selector is set', async () => {
    const calls: { waitForSelector?: unknown[] } = {}

    await runScreenshots([job()], {
      launch: async () => createFakeBrowser(calls),
      sleep: async () => {},
      fs: {
        renameSync: () => {},
        unlinkSync: () => {},
      },
    })

    assert.equal(calls.waitForSelector, undefined)
  })

  it('sets cookies from a JSON file before navigation', async () => {
    const calls: { setCookie?: unknown[]; goto?: unknown[] } = {}
    const dir = mkdtempSync(join(tmpdir(), 'web-screenshot-'))
    const cookiesPath = join(dir, 'session.json')
    writeFileSync(cookiesPath, JSON.stringify([{ name: 'session', value: 'abc', domain: 'example.com' }]), 'utf-8')

    try {
      await runScreenshots([job({ cookiesFile: cookiesPath })], {
        launch: async () => createFakeBrowser(calls),
        sleep: async () => {},
        fs: {
          renameSync: () => {},
          unlinkSync: () => {},
        },
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }

    assert.deepEqual(calls.setCookie, [{ name: 'session', value: 'abc', domain: 'example.com' }])
    assert.deepEqual(calls.goto, [{ url: 'https://example.com', options: { waitUntil: 'networkidle2' } }])
  })
})
