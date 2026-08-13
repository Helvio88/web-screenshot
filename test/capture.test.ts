import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isFullPage, planCapture } from '../src/capture'
import type WebScreenshot from '../src/types/WebScreenshot'

function job(overrides: Partial<WebScreenshot> = {}): WebScreenshot {
  return {
    url: 'https://example.com',
    time: 3000,
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    path: 'example.com',
    tmp: 'example.com_tmp',
    ext: 'png',
    crop: false,
    ...overrides,
  }
}

describe('planCapture', () => {
  it('uses a clip for the default 1920×1080 viewport crop', () => {
    const plan = planCapture(job())
    assert.deepEqual(plan.goto, { url: 'https://example.com', waitUntil: 'networkidle2' })
    assert.equal(plan.extraWaitMs, 3000)
    assert.deepEqual(plan.screenshot, {
      path: 'example.com_tmp.png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    })
  })

  it('uses fullPage when width is 0', () => {
    assert.equal(isFullPage(0, 1080), true)
    assert.deepEqual(planCapture(job({ width: 0 })).screenshot, {
      path: 'example.com_tmp.png',
      fullPage: true,
    })
  })

  it('uses fullPage when height is 0', () => {
    assert.equal(isFullPage(1920, 0), true)
    assert.deepEqual(planCapture(job({ height: 0 })).screenshot, {
      path: 'example.com_tmp.png',
      fullPage: true,
    })
  })

  it('does not treat a normal clip as full-page', () => {
    assert.equal(isFullPage(700, 180), false)
    assert.deepEqual(planCapture(job({ x: 700, y: 190, width: 700, height: 180 })).screenshot, {
      path: 'example.com_tmp.png',
      clip: { x: 700, y: 190, width: 700, height: 180 },
    })
  })
})
