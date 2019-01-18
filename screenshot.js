#!/usr/bin/env node
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

const screenshot = {
  path: program.out,
  clip: {
    x: Number(program.x),
    y: Number(program.y),
    width: Number(program.width),
    height: Number(program.height)
  }
}

// If Width or Height are 0, capture whole page
if (screenshot.clip.width === 0 || screenshot.clip.height === 0) {
  delete screenshot.clip;
  screenshot.fullPage = true;
}

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(program.url, wait);
    await page.screenshot(screenshot);
    await browser.close();
    await Jimp.read(screenshot.path).then(img => img.autocrop().write(screenshot.path));
  })();