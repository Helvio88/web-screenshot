import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Sanitizer from '../src/Sanitizer'

describe('Sanitizer.sanitizeUrl', () => {
  it('prepends http:// when the scheme is missing', () => {
    assert.equal(Sanitizer.sanitizeUrl('github.com'), 'http://github.com')
  })

  it('keeps http and https URLs', () => {
    assert.equal(Sanitizer.sanitizeUrl('https://github.com'), 'https://github.com')
    assert.equal(Sanitizer.sanitizeUrl('http://example.com'), 'http://example.com')
  })

  it('trims whitespace', () => {
    assert.equal(Sanitizer.sanitizeUrl('  example.com  '), 'http://example.com')
  })
})

describe('Sanitizer.sanitizeTime', () => {
  it('converts integer seconds in 1–600 to milliseconds', () => {
    assert.equal(Sanitizer.sanitizeTime(3), 3000)
    assert.equal(Sanitizer.sanitizeTime(1), 1000)
    assert.equal(Sanitizer.sanitizeTime(600), 600000)
  })

  it('accepts numeric strings from the CLI', () => {
    assert.equal(Sanitizer.sanitizeTime('3'), 3000)
    assert.equal(Sanitizer.sanitizeTime('10'), 10000)
  })

  it('falls back to 5000ms for invalid values', () => {
    assert.equal(Sanitizer.sanitizeTime(0), 5000)
    assert.equal(Sanitizer.sanitizeTime(601), 5000)
    assert.equal(Sanitizer.sanitizeTime(3.5), 5000)
    assert.equal(Sanitizer.sanitizeTime('nope'), 5000)
    assert.equal(Sanitizer.sanitizeTime(undefined), 5000)
    assert.equal(Sanitizer.sanitizeTime(true), 5000)
  })
})

describe('Sanitizer.sanitizeX / sanitizeY', () => {
  it('accepts integers in range, including 0', () => {
    assert.equal(Sanitizer.sanitizeX(0), 0)
    assert.equal(Sanitizer.sanitizeX(1920), 1920)
    assert.equal(Sanitizer.sanitizeY(0), 0)
    assert.equal(Sanitizer.sanitizeY(1080), 1080)
  })

  it('accepts numeric strings', () => {
    assert.equal(Sanitizer.sanitizeX('700'), 700)
    assert.equal(Sanitizer.sanitizeY('190'), 190)
  })

  it('defaults out-of-range values to 0', () => {
    assert.equal(Sanitizer.sanitizeX(1921), 0)
    assert.equal(Sanitizer.sanitizeX(-1), 0)
    assert.equal(Sanitizer.sanitizeY(1081), 0)
    assert.equal(Sanitizer.sanitizeY('nope'), 0)
  })
})

describe('Sanitizer.sanitizeWidth / sanitizeHeight', () => {
  it('keeps 0 as the full-page sentinel', () => {
    assert.equal(Sanitizer.sanitizeWidth(0), 0)
    assert.equal(Sanitizer.sanitizeHeight(0), 0)
    assert.equal(Sanitizer.sanitizeWidth('0'), 0)
    assert.equal(Sanitizer.sanitizeHeight('0'), 0)
  })

  it('keeps in-range clip sizes', () => {
    assert.equal(Sanitizer.sanitizeWidth(700), 700)
    assert.equal(Sanitizer.sanitizeHeight(180), 180)
    assert.equal(Sanitizer.sanitizeWidth(1920), 1920)
    assert.equal(Sanitizer.sanitizeHeight(1080), 1080)
  })

  it('defaults invalid width to 1920 and height to 1080', () => {
    assert.equal(Sanitizer.sanitizeWidth(1921), 1920)
    assert.equal(Sanitizer.sanitizeWidth(-1), 1920)
    assert.equal(Sanitizer.sanitizeWidth('wide'), 1920)
    assert.equal(Sanitizer.sanitizeHeight(1081), 1080)
    assert.equal(Sanitizer.sanitizeHeight(undefined), 1080)
  })
})

describe('Sanitizer.sanitizeOutput', () => {
  it('uses the last URL segment and png when out is omitted', () => {
    assert.deepEqual(Sanitizer.sanitizeOutput('http://github.com', false, undefined), {
      path: 'github.com',
      ext: 'png',
    })
  })

  it('uses the last non-empty segment for trailing slashes', () => {
    assert.equal(Sanitizer.sanitizeOutput('http://example.com/path/', false, undefined).path, 'path')
  })

  it('strips a valid extension and normalizes jpg to jpeg', () => {
    assert.deepEqual(Sanitizer.sanitizeOutput('http://x', false, 'logo.jpg'), { path: 'logo', ext: 'jpeg' })
    assert.deepEqual(Sanitizer.sanitizeOutput('http://x', false, 'shot.PNG'), { path: 'shot', ext: 'png' })
    assert.deepEqual(Sanitizer.sanitizeOutput('http://x', false, 'shot.webp'), { path: 'shot', ext: 'webp' })
  })

  it('appends _tmp for temporary paths', () => {
    assert.equal(Sanitizer.sanitizeOutput('http://github.com', true, undefined).path, 'github.com_tmp')
    assert.equal(Sanitizer.sanitizeOutput('http://x', true, 'out.png').path, 'out_tmp')
  })
})

describe('Sanitizer.sanitizeAuth', () => {
  it('returns undefined when auth is missing or invalid', () => {
    assert.equal(Sanitizer.sanitizeAuth(undefined), undefined)
    assert.equal(Sanitizer.sanitizeAuth(''), undefined)
    assert.equal(Sanitizer.sanitizeAuth('nocolon'), undefined)
    assert.equal(Sanitizer.sanitizeAuth('a:b:c'), undefined)
  })

  it('keeps username:password', () => {
    assert.equal(Sanitizer.sanitizeAuth('user:pass'), 'user:pass')
  })
})

describe('Sanitizer.sanitizeWaitFor', () => {
  it('trims a CSS selector', () => {
    assert.equal(Sanitizer.sanitizeWaitFor('  #dashboard  '), '#dashboard')
  })

  it('returns undefined for empty or non-string values', () => {
    assert.equal(Sanitizer.sanitizeWaitFor(undefined), undefined)
    assert.equal(Sanitizer.sanitizeWaitFor(''), undefined)
    assert.equal(Sanitizer.sanitizeWaitFor('   '), undefined)
    assert.equal(Sanitizer.sanitizeWaitFor(true), undefined)
  })
})

describe('Sanitizer.sanitizeWaitTimeout', () => {
  it('converts integer seconds in 1–600 to milliseconds, defaulting to 30s', () => {
    assert.equal(Sanitizer.sanitizeWaitTimeout(30), 30000)
    assert.equal(Sanitizer.sanitizeWaitTimeout(1), 1000)
    assert.equal(Sanitizer.sanitizeWaitTimeout(600), 600000)
    assert.equal(Sanitizer.sanitizeWaitTimeout('45'), 45000)
  })

  it('falls back to 30000ms for invalid values', () => {
    assert.equal(Sanitizer.sanitizeWaitTimeout(undefined), 30000)
    assert.equal(Sanitizer.sanitizeWaitTimeout(0), 30000)
    assert.equal(Sanitizer.sanitizeWaitTimeout(601), 30000)
    assert.equal(Sanitizer.sanitizeWaitTimeout('nope'), 30000)
    assert.equal(Sanitizer.sanitizeWaitTimeout(true), 30000)
  })
})

describe('Sanitizer.sanitizeCookiesFile', () => {
  it('keeps a non-empty path', () => {
    assert.equal(Sanitizer.sanitizeCookiesFile('session.json'), 'session.json')
    assert.equal(Sanitizer.sanitizeCookiesFile('  cookies/session.json  '), 'cookies/session.json')
  })

  it('returns undefined for empty or non-string values', () => {
    assert.equal(Sanitizer.sanitizeCookiesFile(undefined), undefined)
    assert.equal(Sanitizer.sanitizeCookiesFile(''), undefined)
    assert.equal(Sanitizer.sanitizeCookiesFile(true), undefined)
  })
})
