#!/usr/bin/env node
const fs = require('fs');
const Jimp = require('jimp');
const puppeteer = require('puppeteer');
const program = require('commander');

help = () => {
  program.outputHelp();
  console.log('If Width or Height are not specified, a Full Page screenshot will be taken');
  process.exit(0);
}

program
  .option('-u, --url <url>', 'URL (website) to screenshot')
  .option('-x, --x [x]', 'Leftmost Pixel', 0)
  .option('-y, --y [y]', 'Top Pixel', 0)
  .option('-w, --width [width]', 'Width', 0)
  .option('-h, --height [height]', 'Height', 0)
  .option('-o, --out [out]', 'Absolute or Relative Path to save the screenshot')
  .parse(process.argv)

const wait = {waitUntil: 'networkidle0'};

if(!program.url) {
  program.help();
} else {
  program.url = program.url.trim().toLowerCase();
}

if(!program.url.startsWith('http://') && !program.url.startsWith('https://')) {
  program.url = `http://${program.url}`;
}

if(!program.out) {
  const sections = program.url.split('/');
  const count = program.url.endsWith('/') ? 2 : 1
  program.out = `${sections[sections.length - count]}.png`;
}

program.tmp = 'tmp_' + program.out;

const clip = {
  x: Number(program.x),
  y: Number(program.y),
  width: Number(program.width),
  height: Number(program.height)
}

const vPort = {
  width: 1720,
  height: 1080
}

// If Width or Height are 0, capture whole page
let fullPage = false;
if (clip.width === 0 || clip.height === 0) {
  fullPage = true;
}

const screenshot = {
  fullPage: fullPage,
  clip: clip,
  path: program.tmp
}

if(screenshot.fullPage) {
  delete screenshot.clip;
}

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport(vPort);
    await page.goto(program.url, wait);
    await page.screenshot(screenshot);
    await browser.close();
    await Jimp.read(program.tmp).then(img => img.autocrop().write(program.out));
    await fs.unlinkSync(program.tmp);
  })();