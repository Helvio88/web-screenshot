import type WebScreenshot from './types/WebScreenshot'

export type ClipRect = {
  x: number
  y: number
  width: number
  height: number
}

export type ScreenshotCall = { path: string; fullPage: true } | { path: string; clip: ClipRect }

export type WaitForPlan = {
  selector: string
  timeout: number
}

export type CapturePlan = {
  goto: { url: string; waitUntil: 'networkidle2' }
  waitFor?: WaitForPlan
  extraWaitMs: number
  screenshot: ScreenshotCall
}

export function isFullPage(width: number, height: number): boolean {
  return width === 0 || height === 0
}

export function planCapture(ss: WebScreenshot): CapturePlan {
  const path = `${ss.tmp}.${ss.ext}`
  const screenshot: ScreenshotCall = isFullPage(ss.width, ss.height)
    ? { path, fullPage: true }
    : { path, clip: { x: ss.x, y: ss.y, width: ss.width, height: ss.height } }

  return {
    goto: { url: ss.url, waitUntil: 'networkidle2' },
    waitFor: ss.waitFor ? { selector: ss.waitFor, timeout: ss.waitTimeout } : undefined,
    extraWaitMs: ss.time,
    screenshot,
  }
}
