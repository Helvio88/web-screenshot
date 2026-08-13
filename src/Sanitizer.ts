function parseInteger(value: unknown): number | undefined {
  if (typeof value === 'boolean' || value == null) return undefined
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isInteger(n) ? n : undefined
}

const Sanitizer = {
  // Sanitize URL, ensuring it starts with http:// or https://
  // If it doesn't, prepend http://
  sanitizeUrl(url: string): string {
    url = url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`
    }
    return url
  },

  // Sanitize time in seconds, ensuring it's an integer between 1 and 600.
  // Exceptions = 5000 ms (5 seconds)
  sanitizeTime(time: unknown): number {
    const n = parseInteger(time)
    return n !== undefined && n >= 1 && n <= 600 ? n * 1000 : 5000
  },

  // Sanitize x (starting x coordinate), ensuring it's an integer between 0 and 1920.
  // Exceptions = 0
  sanitizeX(x: unknown): number {
    const n = parseInteger(x)
    return n !== undefined && n >= 0 && n <= 1920 ? n : 0
  },

  // Sanitize y (starting y coordinate), ensuring it's an integer between 0 and 1080.
  // Exceptions = 0
  sanitizeY(y: unknown): number {
    const n = parseInteger(y)
    return n !== undefined && n >= 0 && n <= 1080 ? n : 0
  },

  // Sanitize width, ensuring it's an integer between 0 and 1920.
  // 0 = full-page screenshot. Invalid values default to 1920.
  sanitizeWidth(width: unknown): number {
    const n = parseInteger(width)
    return n !== undefined && n >= 0 && n <= 1920 ? n : 1920
  },

  // Sanitize height, ensuring it's an integer between 0 and 1080.
  // 0 = full-page screenshot. Invalid values default to 1080.
  sanitizeHeight(height: unknown): number {
    const n = parseInteger(height)
    return n !== undefined && n >= 0 && n <= 1080 ? n : 1080
  },

  sanitizeOutput(
    url: string,
    tmp: boolean,
    output: string | undefined,
  ): { path: string; ext: 'jpeg' | 'png' | 'webp' } {
    let path: string | undefined = typeof output === 'string' ? output : undefined
    let ext: 'jpeg' | 'png' | 'webp' = 'png'

    // Option out needs to be unset, or end with .png, .jpeg, or .webp. Accept jpg as jpeg
    if (!path || /\.(png|jpg|jpeg|webp)$/i.test(path)) {
      if (path) {
        const rawExt = path.split('.').pop() ?? 'png'
        ext = rawExt.toLowerCase().replace('jpg', 'jpeg') as 'jpeg' | 'png' | 'webp'
        path = path.substring(0, path.lastIndexOf('.'))
      } else {
        const sections = url.split('/')
        const count = url.endsWith('/') ? 2 : 1
        path = sections[sections.length - count]
      }
    }
    if (tmp) path = `${path}_tmp`

    return { path, ext }
  },

  // Sanitize NTLM credentials. Format: username:password (no extra colons).
  sanitizeAuth(auth: string | undefined): string | undefined {
    if (!auth) return undefined
    return /^[^:]+:[^:]+$/.test(auth) ? auth : undefined
  },
}

export default Sanitizer
