import * as fs from 'node:fs'

export type Cookie = {
  name: string
  value: string
  url?: string
  domain?: string
  path?: string
  expires?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

const SAME_SITE: Record<string, Cookie['sameSite']> = {
  strict: 'Strict',
  lax: 'Lax',
  none: 'None',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isCookieLike(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.name === 'string' && typeof value.value === 'string'
}

function sameSite(value: unknown): Cookie['sameSite'] | undefined {
  if (typeof value !== 'string') return undefined
  return SAME_SITE[value.toLowerCase()]
}

function expires(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  return undefined
}

function ensureUrlOrDomain(cookie: Cookie, pageUrl: string): Cookie {
  if (cookie.url || cookie.domain) return cookie
  return { ...cookie, url: pageUrl }
}

function normalizeCookie(raw: Record<string, unknown>, pageUrl: string): Cookie {
  const cookie: Cookie = {
    name: String(raw.name),
    value: String(raw.value),
  }
  if (typeof raw.url === 'string' && raw.url.length > 0) cookie.url = raw.url
  if (typeof raw.domain === 'string' && raw.domain.length > 0) cookie.domain = raw.domain
  if (typeof raw.path === 'string' && raw.path.length > 0) cookie.path = raw.path
  const exp = expires(raw.expires) ?? expires(raw.expirationDate)
  if (exp !== undefined) cookie.expires = exp
  if (typeof raw.httpOnly === 'boolean') cookie.httpOnly = raw.httpOnly
  if (typeof raw.secure === 'boolean') cookie.secure = raw.secure
  const site = sameSite(raw.sameSite)
  if (site) cookie.sameSite = site
  return ensureUrlOrDomain(cookie, pageUrl)
}

function parseJsonCookies(content: string, pageUrl: string): Cookie[] {
  let data: unknown
  try {
    data = JSON.parse(content)
  } catch {
    throw new Error('Cookies file contains invalid JSON.')
  }

  let raw: unknown[]
  if (Array.isArray(data)) {
    raw = data
  } else if (isRecord(data) && Array.isArray(data.cookies)) {
    raw = data.cookies
  } else if (isCookieLike(data)) {
    raw = [data]
  } else {
    throw new Error(
      'Cookies file must be a JSON array of cookies or a Playwright storageState object with a cookies array.',
    )
  }

  return raw.map((item, index) => {
    if (!isCookieLike(item)) {
      throw new Error(`Cookies file entry ${index} is missing name or value.`)
    }
    return normalizeCookie(item, pageUrl)
  })
}

function parseNetscapeCookies(content: string, pageUrl: string): Cookie[] {
  const cookies: Cookie[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '') continue

    let httpOnly = false
    let fieldsLine = line
    if (line.startsWith('#HttpOnly_')) {
      httpOnly = true
      fieldsLine = line.slice('#HttpOnly_'.length)
    } else if (line.startsWith('#')) {
      continue
    }

    const fields = fieldsLine.split('\t')
    if (fields.length < 7) continue

    const [domain, , path, secure, expiry, name, ...valueParts] = fields
    if (!name) continue

    cookies.push(
      ensureUrlOrDomain(
        {
          name,
          value: valueParts.join('\t'),
          domain: domain || undefined,
          path: path || '/',
          secure: String(secure).toUpperCase() === 'TRUE',
          httpOnly,
          expires: expires(Number(expiry)),
        },
        pageUrl,
      ),
    )
  }

  return cookies
}

export function parseCookies(content: string, pageUrl: string): Cookie[] {
  const trimmed = content.trim()
  if (trimmed === '') {
    throw new Error('Cookies file is empty.')
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJsonCookies(trimmed, pageUrl)
  }
  const cookies = parseNetscapeCookies(trimmed, pageUrl)
  if (cookies.length === 0) {
    throw new Error(
      'Cookies file must be a JSON array of cookies, a Playwright storageState object, or a Netscape cookie file.',
    )
  }
  return cookies
}

export function loadCookiesFromFile(
  filePath: string,
  pageUrl: string,
  io: {
    existsSync: (path: string) => boolean
    readFileSync: (path: string, encoding: 'utf-8') => string
  } = fs,
): Cookie[] {
  if (!io.existsSync(filePath)) {
    throw new Error(`Cookies file "${filePath}" does not exist.`)
  }
  return parseCookies(io.readFileSync(filePath, 'utf-8'), pageUrl)
}
