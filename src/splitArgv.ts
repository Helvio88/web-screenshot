/** Split a command line into argv tokens, honoring single/double quotes and backslash escapes. */
export function splitArgv(line: string): string[] {
  const args: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let escaped = false

  for (const char of line) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\' && quote !== "'") {
      escaped = true
      continue
    }

    if (quote) {
      if (char === quote) {
        quote = null
      } else {
        current += char
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        args.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (escaped) current += '\\'
  if (current.length > 0) args.push(current)

  return args
}
