#!/usr/bin/env node
import * as fs from 'node:fs'
import { createProgram, jobsFromOptions } from './cli'
import { runScreenshots } from './runScreenshots'
import type WebScreenshot from './types/WebScreenshot'

const program = createProgram()
program.parse(process.argv)
const options = program.opts()

const debug = Boolean(options.debug)
const chromePath = typeof options.path === 'string' ? options.path : undefined

let jobs: WebScreenshot[] = []
try {
  jobs = jobsFromOptions(options, fs, debug)
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}

if (jobs.length === 0) {
  program.error('Specify --url <url> or --batch <file> with at least one -u/--url line.')
}

;(async () => {
  try {
    const puppeteer = await import('puppeteer')
    await runScreenshots(jobs, {
      debug,
      chromePath,
      launch: (launchOptions) => puppeteer.launch(launchOptions),
    })
    console.log('Screenshot Process Completed Successfully')
    process.exit(0)
  } catch (error) {
    console.error('Screenshot Failed')
    console.error(error)
    process.exit(1)
  }
})()
