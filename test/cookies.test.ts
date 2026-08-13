import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadCookiesFromFile, parseCookies } from '../src/cookies'

const pageUrl = 'https://example.com/dashboard'

describe('parseCookies JSON', () => {
  it('loads a Puppeteer cookie array and fills url when domain is missing', () => {
    const cookies = parseCookies(
      JSON.stringify([
        { name: 'session', value: 'abc' },
        {
          name: 'theme',
          value: 'dark',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax',
        },
      ]),
      pageUrl,
    )
    assert.deepEqual(cookies, [
      { name: 'session', value: 'abc', url: pageUrl },
      {
        name: 'theme',
        value: 'dark',
        domain: '.example.com',
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax',
      },
    ])
  })

  it('loads Playwright storageState JSON', () => {
    const cookies = parseCookies(
      JSON.stringify({
        cookies: [
          {
            name: 'sid',
            value: 'token',
            domain: 'example.com',
            path: '/',
            expires: 1893456000,
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
          },
        ],
        origins: [],
      }),
      pageUrl,
    )
    assert.equal(cookies.length, 1)
    assert.equal(cookies[0].name, 'sid')
    assert.equal(cookies[0].value, 'token')
    assert.equal(cookies[0].domain, 'example.com')
    assert.equal(cookies[0].expires, 1893456000)
    assert.equal(cookies[0].sameSite, 'Strict')
  })

  it('loads a single cookie object', () => {
    const cookies = parseCookies(JSON.stringify({ name: 'a', value: 'b' }), pageUrl)
    assert.deepEqual(cookies, [{ name: 'a', value: 'b', url: pageUrl }])
  })

  it('normalizes lowercase sameSite values', () => {
    const cookies = parseCookies(JSON.stringify([{ name: 'a', value: 'b', sameSite: 'none' }]), pageUrl)
    assert.equal(cookies[0].sameSite, 'None')
  })

  it('rejects invalid JSON', () => {
    assert.throws(() => parseCookies('{not json', pageUrl), /invalid JSON/)
  })

  it('rejects JSON objects that are not cookies', () => {
    assert.throws(
      () => parseCookies(JSON.stringify({ foo: 1 }), pageUrl),
      /JSON array of cookies or a Playwright storageState/,
    )
  })

  it('rejects array entries missing name or value', () => {
    assert.throws(() => parseCookies(JSON.stringify([{ name: 'x' }]), pageUrl), /entry 0 is missing name or value/)
  })

  it('rejects an empty file', () => {
    assert.throws(() => parseCookies('   ', pageUrl), /empty/)
  })
})

describe('parseCookies Netscape', () => {
  it('parses tab-separated cookies including HttpOnly', () => {
    const cookies = parseCookies(
      `# Netscape HTTP Cookie File
.example.com	TRUE	/	TRUE	1893456000	session	abc
#HttpOnly_.example.com	TRUE	/dash	FALSE	0	id	42
`,
      pageUrl,
    )
    assert.equal(cookies.length, 2)
    assert.deepEqual(cookies[0], {
      name: 'session',
      value: 'abc',
      domain: '.example.com',
      path: '/',
      secure: true,
      httpOnly: false,
      expires: 1893456000,
    })
    assert.equal(cookies[1].name, 'id')
    assert.equal(cookies[1].value, '42')
    assert.equal(cookies[1].httpOnly, true)
    assert.equal(cookies[1].secure, false)
    assert.equal(cookies[1].path, '/dash')
    assert.equal(cookies[1].expires, undefined)
  })

  it('rejects unrecognized non-JSON content', () => {
    assert.throws(() => parseCookies('not a cookie file', pageUrl), /Netscape cookie file/)
  })
})

describe('loadCookiesFromFile', () => {
  it('throws when the file is missing', () => {
    assert.throws(
      () =>
        loadCookiesFromFile('missing.json', pageUrl, {
          existsSync: () => false,
          readFileSync: () => {
            throw new Error('should not read')
          },
        }),
      /Cookies file "missing.json" does not exist/,
    )
  })

  it('reads the file and parses JSON cookies', () => {
    const cookies = loadCookiesFromFile('session.json', pageUrl, {
      existsSync: () => true,
      readFileSync: () => JSON.stringify([{ name: 'session', value: 'abc', domain: 'example.com' }]),
    })
    assert.equal(cookies.length, 1)
    assert.equal(cookies[0].name, 'session')
    assert.equal(cookies[0].domain, 'example.com')
  })
})
