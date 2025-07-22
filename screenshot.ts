#!/usr/bin/env node
import * as fs from 'node:fs'
import { Command, Option } from 'commander'
import * as puppeteer from 'puppeteer'
import sharp from 'sharp'

import pkg from './package.json'

const program = new Command()

const help = () => {
  program.outputHelp()
  console.log(
    'If Width or Height are not specified, a Full Page screenshot will be taken',
  )
  process.exit(0)
}

program
  .version(pkg.version)
  .addOption(new Option('-u, --url <url>', 'URL (website) to screenshot').makeOptionMandatory(true))
  .addOption(new Option('-t, --time [s]', 'Number of seconds to wait for page to load').default(3))
  .addOption(new Option('-x, --x [x]', 'Leftmost Pixel').default(0))
  .addOption(new Option('-y, --y [y]', 'Top Pixel').default(0))
  .addOption(new Option('-w, --width [width]', 'Width').default(1920))
  .addOption(new Option('-h, --height [height]', 'Height').default(1080))
  .addOption(new Option('-o, --out [out]', 'Absolute or Relative Path to save the screenshot'))
  .addOption(new Option('-c, --crop', 'Auto crop same-color borders'))
  .addOption(new Option('-d, --debug', 'Prints debug messages'))
  .addOption(new Option('-a, --auth [auth]', 'NTLM Credentials in username:password format'))
  .parse(process.argv)
const options = program.opts()

// Validate URL
let url: string = options.url
if (!url) {
  help()
} else {
  url = url.trim().toLowerCase()
}

if (!url.startsWith('http://') && !url.startsWith('https://')) {
  url = `http://${url}`
}


// Validate the output file name
let out: string = options.out
let ext: 'jpeg' | 'png' | 'webp' = 'png'

// Option out needs to be unset, or end with .png, .jpeg, or .webp
if (!out || /\.(png|jpeg|webp)$/i.test(out)) {
  if(out) {
    // If it has an extension, extract it
    ext = out.split('.').pop() as 'jpeg' | 'png' | 'webp'
    
    // Remove the extension from out
    out = out.substring(0, out.lastIndexOf('.'))
  } else {
    // If out is unset, use the last part of the URL as the filename
    const sections = url.split('/')
    const count = url.endsWith('/') ? 2 : 1
    out = sections[sections.length - count]
  }
} else {
  // If out is set but does not end with a valid extension, throw an error
  console.error('Invalid output file name. It should end with .png, .jpeg, or .webp, or be unset.')
  process.exit(1)
}

// Handle credentials if provided
let credentials: puppeteer.Credentials
const auth: string = options.auth
if (auth && auth.indexOf(':') !== -1) {
  credentials = {
    username: auth.split(':')[0],
    password: auth.split(':')[1],
  }
}

// Create the temporary file name
const tmp = `${out}_tmp`

// Read the timeout from options, defaulting to 3 seconds if not specified
const time = Number(options.time) * 1000 || 3000

// Validate the coordinates and dimensions
const clip = {
  x: Number(options.x),
  y: Number(options.y),
  width: Number(options.width),
  height: Number(options.height),
}

// Set the viewport dimensions
const vPort: puppeteer.Viewport = {
  width: 1920,
  height: 1080,
  isLandscape: true,
}

// Set the screenshot options
const screenshot: puppeteer.ScreenshotOptions = {
  clip,
  path: `${tmp}.${ext}`,
}

const launchOpts: puppeteer.LaunchOptions = { headless: 'shell', args: ['--no-sandbox'] }
const debugFlag = options.debug
if (debugFlag) {
  launchOpts.headless = false
}

const debug = (message) => {
  if (debugFlag) {
    console.debug(message)
  }
}

;(async () => {
  try {
    const browser = await puppeteer.launch(launchOpts)
    debug('Browser Opened')

    const page = await browser.newPage()
    debug('Page Created')

    await page.setViewport(vPort)
    debug('Viewport Set')

    if (credentials) {
      await page.authenticate(credentials)
      debug('Credentials Entered')
    }

    await page.goto(url)
    await sleep(time)
    debug('Page Loaded')

    await page.screenshot(screenshot)
    debug('Screenshot Taken')

    await page.close()
    debug('Page Closed')

    await browser.close()
    debug('Browser Closed')

    if (options.crop) {
      await sharp(`${tmp}.${ext}`).trim({threshold: 0}).toFile(`${out}.${ext}`)
      fs.unlinkSync(`${tmp}.${ext}`)
      debug('Image Cropped')
    } else {
      fs.renameSync(`${tmp}.${ext}`, `${out}.${ext}`)
      debug('Image Saved')
    }
  } catch (e) {
    console.error('Screenshot Failed')
    console.error(e)
    process.exit(1)
  }
})()

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))
