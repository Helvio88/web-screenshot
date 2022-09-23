#!/usr/bin/env ts-node
import { Command, Option } from 'commander'
import * as fs from 'fs'
import * as Jimp from 'jimp'
import * as puppeteer from 'puppeteer'

import pkg from './package.json'

const program = new Command()

const help = () => {
  program.outputHelp()
  console.log('If Width or Height are not specified, a Full Page screenshot will be taken')
  process.exit(0)
}

program
  .version(pkg.version)
  .addOption(new Option('-u, --url <url>', 'URL (website) to screenshot'))
  .addOption(new Option('-t, --time [millis]', 'Time to wait for the website to load').preset(10000))
  .addOption(new Option('-x, --x [x]', 'Leftmost Pixel').preset(0))
  .addOption(new Option('-y, --y [y]', 'Top Pixel').preset(0))
  .addOption(new Option('-w, --width [width]', 'Width').preset(0))
  .addOption(new Option('-h, --height [height]', 'Height').preset(0))
  .addOption(new Option('-o, --out [out]', 'Absolute or Relative Path to save the screenshot'))
  .addOption(new Option('-c, --crop', 'Auto crop same-color borders'))
  .addOption(new Option('-d, --debug', 'Prints debug messages'))
  .addOption(new Option('-a, --auth [auth]', 'NTLM Credentials in username:password format'))
  .parse(process.argv)

// Find Chrome from env var CHROME_PATH
let chrome = process.env.CHROME_PATH
if (chrome && !fs.existsSync(chrome)) {
  chrome = undefined
}

let url = program.getOptionValue('url')
if (!url) {
  help()
} else {
  url = url.trim().toLowerCase()
}

if (!url.startsWith('http://') && !url.startsWith('https://')) {
  url = `http://${url}`
}

let out = program.getOptionValue('auth')
if (!out) {
  const sections = url.split('/')
  const count = url.endsWith('/') ? 2 : 1
  out = `${sections[sections.length - count]}.png`
}

let auth = program.getOptionValue('auth')
if (auth) {
  auth = {
    username: auth.split(':')[0],
    password: auth.split(':')[1]
  }
}

const tmp = out + '_tmp.png'

const x = program.getOptionValue('x')
const y = program.getOptionValue('y')
const width = program.getOptionValue('width')
const height = program.getOptionValue('height')

const clip = {
  x: Number(x),
  y: Number(y),
  width: Number(width),
  height: Number(height)
}

const vPort = {
  width: 1920,
  height: 1080
}

// If Width or Height are 0, capture whole page
let fullPage = false
if (clip.width === 0 || clip.height === 0) {
  fullPage = true
}

const screenshot = {
  fullPage,
  clip,
  path: tmp
}

if (screenshot.fullPage) {
  delete screenshot.clip
}

const launch = { executablePath: chrome, headless: true, args: ['--no-sandbox'] }
const debugFlag = program.getOptionValue('debug')
if (debugFlag) {
  launch.headless = false
}

const debug = (message) => {
  if (debugFlag) {
    console.log(message)
  }
}

  (async () => {
    try {
      const browser = await puppeteer.launch(launch)
      await debug('Browser Opened')

      const page = await browser.newPage()
      await debug('Page Created')

      await page.setViewport(vPort)
      await debug('Viewport Set')

      if (auth) {
        await page.authenticate(auth)
        await debug('Credentials Entered')
      }

      await page.goto(url)
      await debug('Page Loaded')

      await page.screenshot(screenshot)
      await debug('Screenshot Taken')

      await browser.close()
      await debug('Browser Closed')

      if (program.getOptionValue('crop')) {
        await Jimp.read(tmp).then(img => img.autocrop(false).write(out))
        await fs.unlinkSync(tmp)
        await debug('Image Cropped')
      } else {
        await fs.renameSync(tmp, out)
        await debug('Image Saved')
      }
    } catch (e) {
      console.log('Screenshot Failed')
      console.error(e)
      process.exit(1)
    }
  })()
