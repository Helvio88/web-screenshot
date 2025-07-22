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
  sanitizeTime(time: number): number {
    return Number.isInteger(time) && time >= 1 && time <= 600 ? time * 1000 : 5000
  },

  // Sanitize x (starting x coordinate), ensuring it's an integer between 0 and 1920.
  // Exceptions = 0
  sanitizeX(x: number): number {
    return Number.isInteger(x) && x >= 0 && x <= 1920 ? x : 0
  },

  // Sanitize y (starting y coordinate), ensuring it's an integer between 0 and 1080.
  // Exceptions = 0
  sanitizeY(y: number): number {
    return Number.isInteger(y) && y >= 0 && y <= 1080 ? y : 0
  },

  // Sanitize width, ensuring it's an integer between 1 and 1920.
  // Exceptions = 1920
  sanitizeWidth(width: number): number {
    return Number.isInteger(width) && width >= 1 && width <= 1920 ? width : 1920
  },

  // Sanitize height, ensuring it's an integer between 1 and 1080.
  // Exceptions = 1080
  sanitizeHeight(height: number): number {
    return Number.isInteger(height) && height >= 1 && height <= 1080 ? height : 1080
  },

  sanitizeOutput(url: string, tmp: boolean, output: string | undefined): {path: string, ext: 'jpeg' | 'png' | 'webp'} {
    // Validate the output file name
    let path: string = output
    let ext: 'jpeg' | 'png' | 'webp' = 'png'

    // Option out needs to be unset, or end with .png, .jpeg, or .webp. Accept jpg as jpeg
    if (!path || /\.(png|jpg|jpeg|webp)$/i.test(path)) {
      if (path) {
        // If it has an extension, extract it
        ext = path.split('.').pop().replace('jpg', 'jpeg') as 'jpeg' | 'png' | 'webp'

        // Remove the extension from out
        path = path.substring(0, path.lastIndexOf('.'))
      } else {
        // If out is unset, use the last part of the URL as the filename
        const sections = url.split('/')
        const count = url.endsWith('/') ? 2 : 1
        path = sections[sections.length - count]
      }
    }
    if (tmp)
      path = `${path}_tmp`
    
    return { path, ext }
  },

  // Sanitize output file name, ensuring it has a valid extension or is unset
  // Exceptions = unset
  sanitizeAuth(auth: string): string {
    // Format: username:password (no colons in username or password)
    return /^[^:]+:[^:]+$/.test(auth) ? auth : undefined
  }
}

export default Sanitizer