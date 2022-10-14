#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const fs_1 = tslib_1.__importDefault(require("fs"));
const jimp_1 = tslib_1.__importDefault(require("jimp"));
const puppeteer_1 = tslib_1.__importDefault(require("puppeteer"));
const package_json_1 = tslib_1.__importDefault(require("./package.json"));
const program = new commander_1.Command();
const help = () => {
    program.outputHelp();
    console.log('If Width or Height are not specified, a Full Page screenshot will be taken');
    process.exit(0);
};
program
    .version(package_json_1.default.version)
    .addOption(new commander_1.Option('-u, --url <url>', 'URL (website) to screenshot').makeOptionMandatory(true))
    .addOption(new commander_1.Option('-t, --time [s]', 'Number of seconds to wait for page to load').default(3))
    .addOption(new commander_1.Option('-x, --x [x]', 'Leftmost Pixel').default(0))
    .addOption(new commander_1.Option('-y, --y [y]', 'Top Pixel').default(0))
    .addOption(new commander_1.Option('-w, --width [width]', 'Width').default(1920))
    .addOption(new commander_1.Option('-h, --height [height]', 'Height').default(1080))
    .addOption(new commander_1.Option('-o, --out [out]', 'Absolute or Relative Path to save the screenshot'))
    .addOption(new commander_1.Option('-c, --crop', 'Auto crop same-color borders'))
    .addOption(new commander_1.Option('-d, --debug', 'Prints debug messages'))
    .addOption(new commander_1.Option('-a, --auth [auth]', 'NTLM Credentials in username:password format'))
    .parse(process.argv);
const options = program.opts();
let url = options.url;
if (!url) {
    help();
}
else {
    url = url.trim().toLowerCase();
}
if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
}
let out = options.out;
if (!out) {
    const sections = url.split('/');
    const count = url.endsWith('/') ? 2 : 1;
    out = `${sections[sections.length - count]}.png`;
}
let credentials;
const auth = options.auth;
if (auth && auth.indexOf(':') !== -1) {
    credentials = {
        username: auth.split(':')[0],
        password: auth.split(':')[1]
    };
}
const tmp = out + '_tmp.png';
const time = Number(options.time) * 1000 || 3000;
const clip = {
    x: Number(options.x),
    y: Number(options.y),
    width: Number(options.width),
    height: Number(options.height)
};
const vPort = {
    width: 1920,
    height: 1080,
    isLandscape: true
};
const screenshot = {
    clip,
    path: tmp
};
const launch = { headless: true, args: ['--no-sandbox'] };
const debugFlag = options.debug;
if (debugFlag) {
    launch.headless = false;
}
const debug = (message) => {
    if (debugFlag) {
        console.debug(message);
    }
};
(async () => {
    try {
        const browser = await puppeteer_1.default.launch(launch);
        debug('Browser Opened');
        const page = await browser.newPage();
        debug('Page Created');
        await page.setViewport(vPort);
        debug('Viewport Set');
        if (credentials) {
            await page.authenticate(credentials);
            debug('Credentials Entered');
        }
        await page.goto(url);
        await sleep(time);
        debug('Page Loaded');
        await page.screenshot(screenshot);
        debug('Screenshot Taken');
        await page.close();
        debug('Page Closed');
        await browser.close();
        debug('Browser Closed');
        if (options.crop) {
            await jimp_1.default.read(tmp).then(img => img.autocrop(false).write(out));
            await fs_1.default.unlinkSync(tmp);
            debug('Image Cropped');
        }
        else {
            await fs_1.default.renameSync(tmp, out);
            debug('Image Saved');
        }
    }
    catch (e) {
        console.log('Screenshot Failed');
        console.error(e);
        process.exit(1);
    }
})();
const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay));
