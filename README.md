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
  -V, --version          Output the version number
  -b, --batch [file]     Loads a file with one set of arguments per line
  -u, --url <url>        URL (website) to screenshot
  -t, --time [s]         Number of seconds to wait for page to load (default: 3)
  -x, --x [x]            Leftmost Pixel (default: 0)
  -y, --y [y]            Top Pixel (default: 0)
  -w, --width [width]    Width (default: 1920)
  -h, --height [height]  Height (default: 1080)
  -o, --out [out]        Absolute or Relative Path to save the screenshot
  -c, --crop             Auto crop same-color borders
  -d, --debug            Prints debug messages and disables headless
  -a, --auth [auth]      NTLM Credentials in `username:password` format
  --help                 display help for command
```

Tips
----
* For batch mode, each line should contain one set of arguments, such as:
  * `-u https://google.com -x 700 -y 900 -w 700 -h 180 -o google_logo_png --crop`
  * Lines that begin with # will be ignored (comments)
* You can call web-screenshot with the URL only, such as `web-screenshot -u github.com`.
* The program will append `http://` to your URL and save the output file as `github.com.png`.
* If `width` or `height` are `0`, a Full Page screenshot is taken.
* The base viewport is `1920x1080`.
* After the ScreenShot is taken, the borders can be cropped using `--crop`. Powered by [Sharp][4].
* You can screenshot just a rectangle (or clip) of a webpage by providing `x`, `y`, `w` and `h`, such as
```bash
web-screenshot -u https://google.com -x 700 -y 190 -w 700 -h 180 -o google_logo.png --crop
```
Coordinates are approximate and you can either use a tool to measure the pixels or trial and error.

The command outputs the image:

google_logo.png

![google_logo.png][5]

Happy Screenshotting!

[1]: https://travis-ci.org/Helvio88/web-screenshot.svg?branch=master "Build Status"
[2]: https://travis-ci.org/Helvio88/web-screenshot#
[3]: https://github.com/GoogleChrome/puppeteer
[4]: https://sharp.pixelplumbing.com
[5]: https://i.imgur.com/AmoKkrg.png "google_logo.png"
