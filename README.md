[![Build Status][1]][2]

web-screenshot
==============
A tool to take screenshots of websites headlessly.

Installation
------------

```node
npm install -g @helvio/web-screenshot --unsafe-perm
```
--unsafe-perm is necessary to install [puppeteer][3] on your computer.

Usage
-----
```bash
$ web-screenshot --help
Usage: screenshot [options]

Options:
  -u, --url <url>        URL (website) to screenshot
  -x, --x [x]            Leftmost Pixel (default: 0)
  -y, --y [y]            Top Pixel (default: 0)
  -w, --width [width]    Width (default: 0)
  -h, --height [height]  Height (default: 0)
  -o, --out [out]        Absolute or Relative Path to save the screenshot
  -h, --help             output usage information
```

Tips
----
* You can call web-screenshot with the URL only, such as `web-screenshot -u github.com`.
* The program will append `http://` to your URL and save the output file as `github.com.png`.
* If `width` or `height` are `0`, a Full Page screenshot is taken.
* The base viewport is `1720x1080`.
* After the ScreenShot is taken, the borders are cropped using [Jimp][4].
* You can screenshot just a rectangle (or clip) of a webpage by providing `x`, `y`, `w` and `h`, such as
```bash
web-screenshot -u https://google.com -x 700 -y 190 -w 300 -h 115 -o google_logo.png
```
Coordinates are approximate and you can either use a tool to measure the pixels or trial and error.

The command outputs the image:

google_logo.png

![google_logo.png][5]

Happy Screenshotting!

[1]: https://travis-ci.org/Helvio88/web-screenshot.svg?branch=master "Build Status"
[2]: https://travis-ci.org/Helvio88/web-screenshot#
[3]: https://github.com/GoogleChrome/puppeteer
[4]: https://github.com/oliver-moran/jimp
[5]: https://i.imgur.com/AmoKkrg.png "google_logo.png"
