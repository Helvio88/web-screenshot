#!/usr/bin/env node
const fs = require('fs');
const Jimp = require('jimp');
const puppeteer = require('puppeteer');
const program = require('commander');
const package = require('./package.json');

help = () => {
  program.outputHelp();
  console.log('If Width or Height are not specified, a Full Page screenshot will be taken');
  process.exit(0);
}

program
  .version(package.version)
  .option('-u, --url <url>', 'URL (website) to screenshot')
  .option('-x, --x [x]', 'Leftmost Pixel', 0)
  .option('-y, --y [y]', 'Top Pixel', 0)
  .option('-w, --width [width]', 'Width', 0)
  .option('-h, --height [height]', 'Height', 0)
  .option('-o, --out [out]', 'Absolute or Relative Path to save the screenshot')
  .option('-c, --crop', 'Auto crop same-color borders')
  .option('-d, --debug', 'Prints debug messages')
  .option('-a, --auth [auth]', 'NTLM Credentials in username:password format')
  .parse(process.argv)

// Find Chrome from env var CHROME_PATH
let chrome = process.env.CHROME_PATH;
if(chrome && !fs.existsSync(chrome)) {
  chrome = undefined;
}

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

if(program.auth) {
  program.auth = {
    username: program.auth.split(':')[0],
    password: program.auth.split(':')[1]
  }
}

program.tmp = program.out + '_tmp.png';

const clip = {
  x: Number(program.x),
  y: Number(program.y),
  width: Number(program.width),
  height: Number(program.height)
}

const vPort = {
  width: 1920,
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

debug = (message) => {
  if(program.debug) {
    console.log(message);
  }
}

  (async () => {
    try {
      const browser = await puppeteer.launch({executablePath: chrome});
      await debug('Browser Opened');

      const page = await browser.newPage();
      await debug('Page Created');

      await page.setViewport(vPort);
      await debug('Viewport Set');

      if(program.auth) {
        await page.authenticate(program.auth);
        await debug('Credentials Entered');
      }

      await page.goto(program.url, wait);
      await debug('Page Loaded');

      await page.screenshot(screenshot);
      await debug('Screenshot Taken');

      await browser.close();
      await debug('Browser Closed');

      if(program.crop) {
        await Jimp.read(program.tmp).then(img => img.autocrop().write(program.out));
        await fs.unlinkSync(program.tmp);
        await debug('Image Cropped');
      } else {
        await fs.renameSync(program.tmp, program.out);
        await debug('Image Saved');
      }
    } catch {
      console.log('Screenshot Failed');
      process.exit(1);
    }
  })();