import * as fs from 'node:fs'
import { planCapture } from './capture'
import { type Cookie, loadCookiesFromFile } from './cookies'
import type WebScreenshot from './types/WebScreenshot'

export type LaunchOptions = {
  headless: boolean | 'shell'
  executablePath?: string
  args: string[]
}

export type PageLike = {
  authenticate: (credentials: { username: string; password: string }) => Promise<void>
  setCookie: (...cookies: Cookie[]) => Promise<void>
  setViewport: (viewport: { width: number; height: number }) => Promise<void>
  goto: (url: string, options?: { waitUntil: 'networkidle2' }) => Promise<unknown>
  waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<unknown>
  screenshot: (options: Record<string, unknown>) => Promise<unknown>
  close: () => Promise<void>
}

export type BrowserLike = {
  newPage: () => Promise<PageLike>
  close: () => Promise<void>
}

export type ScreenshotRuntime = {
  debug?: boolean
  chromePath?: string
  launch: (options: LaunchOptions) => Promise<BrowserLike>
  sleep?: (ms: number) => Promise<unknown>
  trimToFile?: (input: string, output: string) => Promise<void>
  fs?: {
    renameSync: (src: string, dest: string) => void
    unlinkSync: (path: string) => void
  }
}

const defaultSleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

async function defaultTrimToFile(input: string, output: string): Promise<void> {
  const sharp = (await import('sharp')).default
  await sharp(input).trim({ threshold: 0 }).toFile(output)
}

export async function runScreenshots(jobs: WebScreenshot[], runtime: ScreenshotRuntime): Promise<void> {
  const sleep = runtime.sleep ?? defaultSleep
  const fileOps = runtime.fs ?? fs
  const trimToFile = runtime.trimToFile ?? defaultTrimToFile

  const launchOptions: LaunchOptions = {
    headless: runtime.debug ? false : 'shell',
    args: ['--no-sandbox'],
  }
  if (runtime.chromePath) launchOptions.executablePath = runtime.chromePath

  const browser = await runtime.launch(launchOptions)
  console.log('Browser Opened')

  try {
    const page = await browser.newPage()
    console.log('Page Created')

    await page.setViewport({ width: 1920, height: 1080 })
    console.log('Viewport Set')

    try {
      for (const ss of jobs) {
        if (ss.auth) {
          const [username, password] = ss.auth.split(':')
          await page.authenticate({ username, password: password ?? '' })
          console.log('Credentials Entered')
        }

        if (ss.cookiesFile) {
          const cookies = loadCookiesFromFile(ss.cookiesFile, ss.url)
          if (cookies.length > 0) {
            await page.setCookie(...cookies)
            console.log(`Cookies loaded from ${ss.cookiesFile}`)
          }
        }

        const plan = planCapture(ss)
        await page.goto(plan.goto.url, { waitUntil: plan.goto.waitUntil })
        console.log(`Navigated to ${ss.url}`)

        if (plan.waitFor) {
          console.log(`Waiting for selector ${plan.waitFor.selector}`)
          await page.waitForSelector(plan.waitFor.selector, { timeout: plan.waitFor.timeout })
        }

        console.log(`Waiting for ${ss.time / 1000} seconds`)
        await sleep(plan.extraWaitMs)
        console.log('Page Loaded')

        await page.screenshot(plan.screenshot)
        console.log(`Temp screenshot taken: ${ss.tmp}.${ss.ext}`)

        if (ss.crop) {
          await trimToFile(`${ss.tmp}.${ss.ext}`, `${ss.path}.${ss.ext}`)
          fileOps.unlinkSync(`${ss.tmp}.${ss.ext}`)
          console.log(`Image cropped and saved to ${ss.path}.${ss.ext}`)
        } else {
          fileOps.renameSync(`${ss.tmp}.${ss.ext}`, `${ss.path}.${ss.ext}`)
          console.log(`Image saved to ${ss.path}.${ss.ext}`)
        }
      }
    } finally {
      await page.close()
      console.log('Page Closed')
    }
  } finally {
    await browser.close()
    console.log('Browser Closed')
  }
}
