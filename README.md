[![CI](https://github.com/Helvio88/web-screenshot/actions/workflows/ci.yml/badge.svg)](https://github.com/Helvio88/web-screenshot/actions/workflows/ci.yml)

web-screenshot
==============
CLI to take screenshots of websites headlessly (Puppeteer, optional Sharp crop).

Maintained by Helvio Pedreschi ([Helvio88](https://github.com/Helvio88) / [helv-io](https://github.com/helv-io)).

Installation
------------

```bash
npm install -g @helvio/web-screenshot
```

Or run without a global install:

```bash
npx -p @helvio/web-screenshot web-screenshot --help
```

Puppeteer downloads a Chrome build during install. If that download is skipped or blocked, point `-p` / `--path` at a Chrome/Chromium binary, or see [Puppeteer installation](https://pptr.dev/guides/installation).

Usage
-----
```bash
$ web-screenshot --help
Web Screenshot Utility
Usage: web-screenshot [options]

Take screenshots of web pages

Options:
  -V, --version              output the version number
  -p, --path [path]          Chrome executable path.
  -d, --debug                Enable debug mode. (default: false)
  -b, --batch [file]         Batch file with URLs to screenshot. Supersedes all
                             other options.
  -u, --url <url>            URL (website) to screenshot.
  -t, --time [s]             Extra seconds to wait after the page is idle.
                             (default: 3)
  -x, --x [x]                Leftmost pixel. (default: 0)
  -y, --y [y]                Top pixel. (default: 0)
  -w, --width [width]        Image width in pixels. 0 takes a full-page
                             screenshot. (default: 1920)
  -h, --height [height]      Image height in pixels. 0 takes a full-page
                             screenshot. (default: 1080)
  -o, --out [out]            Absolute or relative path to save the screenshot.
  -c, --crop                 Auto crop same-color borders.
  -a, --auth [auth]          HTTP basic/NTLM credentials in username:password
                             format.
  -s, --wait-for <selector>  CSS selector to wait for before taking the
                             screenshot.
  --wait-timeout [s]         Seconds to wait for --wait-for. Ignored without
                             --wait-for. (default: 30)
  --cookies <file>           Cookies file: JSON array, Playwright storageState,
                             or Netscape format. Applied before navigation.
  --help                     display help for command

Examples:
  $ web-screenshot -u https://example.com
  $ web-screenshot -u github.com -w 0 -h 0 -o full.png
  $ web-screenshot -u https://google.com -x 700 -y 190 -w 700 -h 180 -o google_logo.png --crop
  $ web-screenshot -u https://example.com --wait-for "#dashboard" --wait-timeout 30 -t 2 -o dashboard.png
  $ web-screenshot -u https://example.com --cookies cookies.json -o dashboard.png
  $ web-screenshot -b jobs.txt
```

Tips
----
* Navigation waits until the network is idle (`networkidle2`). If `-s` / `--wait-for` is set, the CLI then waits for that CSS selector (`page.waitForSelector`, up to `--wait-timeout` seconds, default 30; invalid values fall back to 30, clamped to 1–600). After that, `-t` extra seconds (default 3; invalid values fall back to 5 seconds, clamped to 1–600).
* Login-gated dashboards: use `-a` / `--auth user:pass` for HTTP basic or NTLM, and/or `--cookies cookies.json` for session cookies. The cookies file can be a JSON array of Puppeteer cookies, Playwright `storageState` JSON, or a Netscape cookie file. Cookies missing `url` and `domain` use the screenshot URL.
* For batch mode, each line should contain one set of arguments, such as:
  * `-u https://google.com -x 700 -y 900 -w 700 -h 180 -o google_logo.png --crop`
  * `-u https://example.com --wait-for "#dashboard" --wait-timeout 45 -t 2 --cookies session.json -o dashboard.png`
  * Quoted paths and selectors are supported: `-u https://example.com --wait-for "#main .dashboard" -o "My Screenshots/home.png"`
  * Lines that begin with `#` will be ignored (comments)
* You can call web-screenshot with the URL only, such as `web-screenshot -u github.com`.
* The program will append `http://` to your URL and save the output file as `github.com.png`.
* If `width` or `height` is `0`, a full-page screenshot is taken. Otherwise the screenshot is clipped to `x`, `y`, `width`, and `height`.
* The base viewport is `1920x1080`.
* After the screenshot is taken, the borders can be cropped using `--crop`. Powered by [Sharp](https://sharp.pixelplumbing.com).
* You can screenshot just a rectangle (or clip) of a webpage by providing `x`, `y`, `w` and `h`, such as
```bash
web-screenshot -u https://google.com -x 700 -y 190 -w 700 -h 180 -o google_logo.png --crop
```
Coordinates are approximate and you can either use a tool to measure the pixels or trial and error.

The command outputs the image:

google_logo.png

![google_logo.png](https://i.imgur.com/AmoKkrg.png "google_logo.png")

Happy Screenshotting!
