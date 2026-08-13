import * as fs from 'node:fs'
import { Command, Option } from 'commander'
import pkg from '../package.json'
import Sanitizer from './Sanitizer'
import { splitArgv } from './splitArgv'
import type WebScreenshot from './types/WebScreenshot'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('web-screenshot')
    .description('Take screenshots of web pages')
    .version(pkg.version)
    .addHelpText('beforeAll', 'Web Screenshot Utility')
    .showHelpAfterError()
    .addOption(new Option('-p, --path [path]', 'Chrome executable path.'))
    .addOption(new Option('-d, --debug', 'Enable debug mode.').default(false))
    .addOption(new Option('-b, --batch [file]', 'Batch file with URLs to screenshot. Supersedes all other options.'))
    .addOption(new Option('-u, --url <url>', 'URL (website) to screenshot.'))
    .addOption(new Option('-t, --time [s]', 'Extra seconds to wait after the page is idle.').default(3))
    .addOption(new Option('-x, --x [x]', 'Leftmost pixel.').default(0))
    .addOption(new Option('-y, --y [y]', 'Top pixel.').default(0))
    .addOption(
      new Option('-w, --width [width]', 'Image width in pixels. 0 takes a full-page screenshot.').default(1920),
    )
    .addOption(
      new Option('-h, --height [height]', 'Image height in pixels. 0 takes a full-page screenshot.').default(1080),
    )
    .addOption(new Option('-o, --out [out]', 'Absolute or relative path to save the screenshot.'))
    .addOption(new Option('-c, --crop', 'Auto crop same-color borders.'))
    .addOption(new Option('-a, --auth [auth]', 'HTTP basic/NTLM credentials in username:password format.'))
    .addOption(new Option('-s, --wait-for <selector>', 'CSS selector to wait for before taking the screenshot.'))
    .addOption(
      new Option('--wait-timeout [s]', 'Seconds to wait for --wait-for. Ignored without --wait-for.').default(30),
    )
    .addOption(
      new Option(
        '--cookies <file>',
        'Cookies file: JSON array, Playwright storageState, or Netscape format. Applied before navigation.',
      ),
    )
    .addHelpText(
      'after',
      `
Examples:
  $ web-screenshot -u https://example.com
  $ web-screenshot -u github.com -w 0 -h 0 -o full.png
  $ web-screenshot -u https://google.com -x 700 -y 190 -w 700 -h 180 -o google_logo.png --crop
  $ web-screenshot -u https://example.com --wait-for "#dashboard" --wait-timeout 30 -t 2 -o dashboard.png
  $ web-screenshot -u https://example.com --cookies cookies.json -o dashboard.png
  $ web-screenshot -b jobs.txt
`,
    )

  return program
}

export function optionsToScreenshot(options: {
  url?: string
  time?: unknown
  x?: unknown
  y?: unknown
  width?: unknown
  height?: unknown
  out?: unknown
  auth?: unknown
  crop?: unknown
  waitFor?: unknown
  waitTimeout?: unknown
  cookies?: unknown
}): WebScreenshot | undefined {
  if (!options.url || typeof options.url !== 'string') return undefined

  const url = Sanitizer.sanitizeUrl(options.url)
  const outValue = typeof options.out === 'string' ? options.out : undefined
  const outSanitized = Sanitizer.sanitizeOutput(url, false, outValue)
  const tmpSanitized = Sanitizer.sanitizeOutput(url, true, outValue)
  const authValue = typeof options.auth === 'string' ? options.auth : undefined

  return {
    url,
    time: Sanitizer.sanitizeTime(options.time),
    x: Sanitizer.sanitizeX(options.x),
    y: Sanitizer.sanitizeY(options.y),
    width: Sanitizer.sanitizeWidth(options.width),
    height: Sanitizer.sanitizeHeight(options.height),
    path: outSanitized.path,
    tmp: tmpSanitized.path,
    ext: outSanitized.ext,
    auth: Sanitizer.sanitizeAuth(authValue),
    crop: Boolean(options.crop),
    waitFor: Sanitizer.sanitizeWaitFor(options.waitFor),
    waitTimeout: Sanitizer.sanitizeWaitTimeout(options.waitTimeout),
    cookiesFile: Sanitizer.sanitizeCookiesFile(options.cookies),
  }
}

export function parseBatchContent(content: string, debug = false): WebScreenshot[] {
  const screenshots: WebScreenshot[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue

    const args = splitArgv(line)
    if (debug) console.log('Parsed arguments:', args)

    try {
      const program = createProgram()
      program.exitOverride()
      program.configureOutput({
        writeOut: () => {},
        writeErr: () => {},
      })
      program.parse(args, { from: 'user' })
      const screenshot = optionsToScreenshot(program.opts())
      if (!screenshot) {
        if (debug) console.log('No URL found in line, skipping:', line)
        continue
      }
      screenshots.push(screenshot)
    } catch (error) {
      if (debug) console.log('Invalid batch line, skipping:', line, error)
    }
  }

  return screenshots
}

export function jobsFromOptions(
  options: { batch?: unknown; url?: string } & Record<string, unknown>,
  io: {
    existsSync: typeof fs.existsSync
    readFileSync: typeof fs.readFileSync
  } = fs,
  debug = false,
): WebScreenshot[] {
  if (options.batch) {
    const batchFile = String(options.batch)
    if (!io.existsSync(batchFile)) {
      throw new Error(`Batch file "${batchFile}" does not exist.`)
    }
    return parseBatchContent(io.readFileSync(batchFile, 'utf-8'), debug)
  }

  const screenshot = optionsToScreenshot(options)
  return screenshot ? [screenshot] : []
}

export function parseCli(argv: string[]) {
  const program = createProgram()
  program.exitOverride()
  program.parse(argv, { from: 'user' })
  return {
    program,
    options: program.opts(),
    job: optionsToScreenshot(program.opts()),
  }
}
