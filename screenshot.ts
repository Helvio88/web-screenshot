#!/usr/bin/env node
import { Command, Option } from 'commander'
import fs from 'fs'
import Jimp from 'jimp'
import puppeteer, { Credentials, PuppeteerLaunchOptions, ScreenshotOptions, Viewport } from 'puppeteer'

import pkg from './package.json'

const program = new Command()

const help = () => {
  program.outputHelp()
  console.log('If Width or Height are not specified, a Full Page screenshot will be taken')
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

let url: string = options.url
if (!url) {
  help()
} else {
  url = url.trim().toLowerCase()
}

if (!url.startsWith('http://') && !url.startsWith('https://')) {
  url = `http://${url}`
}

let out: string = options.out
if (!out) {
  const sections = url.split('/')
  const count = url.endsWith('/') ? 2 : 1
  out = `${sections[sections.length - count]}.png`
}

let credentials: Credentials
const auth: string = options.auth
if (auth && auth.indexOf(':') !== -1) {
  credentials = {
    username: auth.split(':')[0],
    password: auth.split(':')[1]
  }
}

const tmp = out + '_tmp.png'

const time = Number(options.time) * 1000 || 3000

const clip = {
  x: Number(options.x),
  y: Number(options.y),
  width: Number(options.width),
  height: Number(options.height)
}

const vPort: Viewport = {
  width: 1920,
  height: 1080,
  isLandscape: true
}

const screenshot: ScreenshotOptions = {
  clip,
  path: tmp
}

const launch: PuppeteerLaunchOptions = { headless: true, args: ['--no-sandbox'] }
const debugFlag = options.debug
if (debugFlag) {
  launch.headless = false
}

const debug = (message) => {
  if (debugFlag) {
    console.debug(message)
  }
}

  (async () => {
    try {
      const browser = await puppeteer.launch(launch)
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
        const jimp = await Jimp.read(tmp)
        await jimp.autocrop(false).write(out)
        await fs.unlinkSync(tmp)
        debug('Image Cropped')
      } else {
        await fs.renameSync(tmp, out)
        debug('Image Saved')
      }
    } catch (e) {
      console.log('Screenshot Failed')
      console.error(e)
      process.exit(1)
    }
  })()

  const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay))
