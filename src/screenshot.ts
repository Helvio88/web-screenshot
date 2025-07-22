#!/usr/bin/env node
import * as fs from 'node:fs'
import { Command, Option } from 'commander'
import * as puppeteer from 'puppeteer'
import sharp from 'sharp'
import pkg from '../package.json'
import Sanitizer from './Sanitizer'
import type WebScreenshot from './types/WebScreenshot'

const program = new Command()

program
  .version(pkg.version)
  .addHelpText('beforeAll', 'Web Screenshot Utility')

  // Screenshot options
  .addOption(new Option('-d, --debug', 'Enable debug mode.').default(false))
  .addOption(new Option('-b, --batch [file]', 'Batch file with URLs to screenshot. Supersedes all other options.'))
  .addOption(new Option('-u, --url <url>', 'URL (website) to screenshot.'))
  .addOption(new Option('-t, --time [s]', 'Number of seconds to wait for page to load.').default(3))
  .addOption(new Option('-x, --x [x]', 'Leftmost Pixel.').default(0))
  .addOption(new Option('-y, --y [y]', 'Top Pixel.').default(0))
  .addOption(new Option('-w, --width [width]', 'Image Width.').default(1920))
  .addOption(new Option('-h, --height [height]', 'Image Height.').default(1080))
  .addOption(new Option('-o, --out [out]', 'Absolute or Relative Path to save the screenshot.'))
  .addOption(new Option('-c, --crop', 'Auto crop same-color borders.'))
  .addOption(new Option('-a, --auth [auth]', 'NTLM Credentials in username:password format.'))
  .parse(process.argv)
const options = program.opts()

// Create the WebScreenshot object array
const screenshots: WebScreenshot[] = []

const debug = options.debug || false

if (options.batch) {
  // If batch file is provided, read it and parse URLs
  const batchFile = options.batch
  if (!fs.existsSync(batchFile)) {
    console.error(`Batch file "${batchFile}" does not exist.`)
    process.exit(1)
  }
  
  // Read the batch file and parse each line, ignoring #comments and empty lines
  const batchContent = fs.readFileSync(batchFile, 'utf-8')
  const batchLines = batchContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'))
  
  // Loop through each line in the batch file
  for (const line of batchLines) {
    // Split the line into arguments, filtering out empty strings (multiple spaces)
    const args = line.split(' ').filter((arg) => arg.trim() !== '')
    if (debug) console.log(`Parsed arguments:`, args)

    // Find the index of the URL argument, either with -u or --url
    const urlIndex = args.findIndex((arg) => arg.startsWith('-u') || arg.startsWith('--url'))
    if (urlIndex === -1) {
      if (debug) console.log('No URL found in line, skipping:', line)
      continue
    }
    // Extract and sanitize the URL
    const url = Sanitizer.sanitizeUrl(args[urlIndex + 1])

    // Extract and sanitize the time argument
    const timeIndex = args.findIndex((arg) => arg.startsWith('-t') || arg.startsWith('--time'))
    let timeValue = 3
    if (timeIndex !== -1) {
      timeValue = Number(args[timeIndex + 1])
    }
    const time = Sanitizer.sanitizeTime(timeValue)
    if (debug) console.log(`Sanitized time: ${time}`)

    // Extract and sanitize the x argument
    const xIndex = args.findIndex((arg) => arg.startsWith('-x') || arg.startsWith('--x'))
    let xValue = 0
    if (xIndex !== -1) {
      xValue = Number(args[xIndex + 1])
    }
    const x = Sanitizer.sanitizeX(xValue)
    if (debug) console.log(`Sanitized x: ${x}`)

    // Extract and sanitize the y argument
    const yIndex = args.findIndex((arg) => arg.startsWith('-y') || arg.startsWith('--y'))
    let yValue = 0
    if (yIndex !== -1) {
      yValue = Number(args[yIndex + 1])
    }
    const y = Sanitizer.sanitizeY(yValue)
    if (debug) console.log(`Sanitized y: ${y}`)

    // Extract and sanitize the width argument
    const widthIndex = args.findIndex((arg) => arg.startsWith('-w') || arg.startsWith('--width'))
    let widthValue = 1920
    if (widthIndex !== -1) {
      widthValue = Number(args[widthIndex + 1])
    }
    const width = Sanitizer.sanitizeWidth(widthValue)
    if (debug) console.log(`Sanitized width: ${width}`)

    // Extract and sanitize the height argument
    const heightIndex = args.findIndex((arg) => arg.startsWith('-h') || arg.startsWith('--height'))
    let heightValue = 1080
    if (heightIndex !== -1) {
      heightValue = Number(args[heightIndex + 1])
    }
    const height = Sanitizer.sanitizeHeight(heightValue)
    if (debug) console.log(`Sanitized height: ${height}`)

    // Extract and sanitize the output path
    const outIndex = args.findIndex((arg) => arg.startsWith('-o') || arg.startsWith('--out'))
    let outValue: string | undefined
    if (outIndex !== -1) {
      outValue = args[outIndex + 1]
    }
    const outSanitized = Sanitizer.sanitizeOutput(url, false, outValue)
    const tmpSanitized = Sanitizer.sanitizeOutput(url, true, outValue)
    const path = outSanitized.path
    const tmp = tmpSanitized.path
    const ext = outSanitized.ext
    if (debug) console.log(`Sanitized output path: ${outSanitized.path}, tmp: ${tmpSanitized.path}, ext: ${outSanitized.ext}`)

    // Check for crop flag
    const crop = args.includes('--crop') || args.includes('-c')
    if (debug) console.log(`Crop flag: ${crop}`)

    // Extract and sanitize the auth argument
    const authIndex = args.findIndex((arg) => arg.startsWith('-a') || arg.startsWith('--auth'))
    let authValue: string | undefined
    if (authIndex !== -1) {
      authValue = args[authIndex + 1]
    }
    const auth = authValue ? Sanitizer.sanitizeAuth(authValue) : undefined
    if (debug) console.log(`Sanitized auth: ${auth}`)

    screenshots.push({
      url,
      time,
      x,
      y,
      width,
      height,
      path,
      tmp,
      ext,
      auth,
      crop,
    })
  }
} else {
  // If no batch file, create a single screenshot object, skipping empty URLs
  if (options.url)
    screenshots.push({
      url: Sanitizer.sanitizeUrl(options.url),
      time: Sanitizer.sanitizeTime(options.time),
      x: Sanitizer.sanitizeX(Number(options.x)),
      y: Sanitizer.sanitizeY(Number(options.y)),
      width: Sanitizer.sanitizeWidth(Number(options.width)),
      height: Sanitizer.sanitizeHeight(Number(options.height)),
      path: Sanitizer.sanitizeOutput(options.url, false, options.out).path,
      tmp: Sanitizer.sanitizeOutput(options.url, true, options.out).path,
      ext: Sanitizer.sanitizeOutput(options.url, false, options.out).ext,
      auth: Sanitizer.sanitizeAuth(options.auth),
      crop: options.crop || false,
    })
}

// Main function to take screenshots
;(async () => {
  try {
    const browser = await puppeteer.launch({ headless: debug ? false : 'shell', args: ['--no-sandbox'] })
    console.log('Browser Opened')

    const page = await browser.newPage()
    console.log('Page Created')

    await page.setViewport({ width: 1920, height: 1080 })
    console.log('Viewport Set')
    
    // Loop on each screenshot object
    for (const ss of screenshots) {
      if(ss.auth) {
        await page.authenticate({ username: ss.auth.split(':')[0], password: ss.auth.split(':')[1] })
        console.log('Credentials Entered')
      }
      
      await page.goto(ss.url)
      console.log(`Navigated to ${ss.url}`)
      
      console.log(`Waiting for ${ss.time / 1000} seconds`)
      await sleep(ss.time)
      console.log('Page Loaded')
      
      await page.screenshot({
        clip: {
          x: ss.x,
          y: ss.y,
          width: ss.width,
          height: ss.height
        },
        path: `${ss.tmp}.${ss.ext}`
      })
      console.log(`Temp screenshot taken: ${ss.tmp}.${ss.ext}`)
      
      if(ss.crop) {
        await sharp(`${ss.tmp}.${ss.ext}`).trim({ threshold: 0 }).toFile(`${ss.path}.${ss.ext}`)
        fs.unlinkSync(`${ss.tmp}.${ss.ext}`)
        console.log(`Image cropped and saved to ${ss.path}.${ss.ext}`)
      } else {
        fs.renameSync(`${ss.tmp}.${ss.ext}`, `${ss.path}.${ss.ext}`)
        console.log(`Image saved to ${ss.path}.${ss.ext}`)
      }
    }

    await page.close()
    console.log('Page Closed')

    await browser.close()
    console.log('Browser Closed')
    
    // Exit the process with success
    console.log('Screenshot Process Completed Successfully')
    process.exit(0)
  } catch (e) {
    console.error('Screenshot Failed')
    console.error(e)
    process.exit(1)
  }
})()

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))
