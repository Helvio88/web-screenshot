import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import pkg from '../package.json'
import { createProgram, jobsFromOptions, parseBatchContent, parseCli } from '../src/cli'

describe('CLI help', () => {
  it('uses the web-screenshot bin name and documents current flags', () => {
    const help = createProgram().helpInformation()
    assert.match(help, /Usage: web-screenshot \[options\]/)
    assert.match(help, /-u, --url <url>/)
    assert.match(help, /-o, --out \[out\]/)
    assert.match(help, /-t, --time \[s\]/)
    assert.match(help, /-x, --x \[x\]/)
    assert.match(help, /-y, --y \[y\]/)
    assert.match(help, /-w, --width \[width\]/)
    assert.match(help, /-h, --height \[height\]/)
    assert.match(help, /-c, --crop/)
    assert.match(help, /-b, --batch \[file\]/)
    assert.match(help, /-d, --debug/)
    assert.match(help, /-a, --auth \[auth\]/)
    assert.match(help, /-p, --path \[path\]/)
    assert.match(help, /--help/)
    assert.match(help, /-V, --version/)
    assert.doesNotMatch(help, /Usage: screenshot /)
  })

  it('shows the package version', () => {
    assert.equal(createProgram().version(), pkg.version)
  })
})

describe('CLI arg parsing', () => {
  it('applies sanitizer defaults for a URL-only invocation', () => {
    const { job } = parseCli(['-u', 'github.com'])
    assert.ok(job)
    assert.equal(job.url, 'http://github.com')
    assert.equal(job.time, 3000)
    assert.equal(job.x, 0)
    assert.equal(job.y, 0)
    assert.equal(job.width, 1920)
    assert.equal(job.height, 1080)
    assert.equal(job.path, 'github.com')
    assert.equal(job.tmp, 'github.com_tmp')
    assert.equal(job.ext, 'png')
    assert.equal(job.crop, false)
    assert.equal(job.auth, undefined)
  })

  it('treats string -t 3 as 3000ms rather than the invalid-input fallback', () => {
    const { job } = parseCli(['-u', 'https://example.com', '-t', '3'])
    assert.equal(job?.time, 3000)
  })

  it('uses -h for height, not help', () => {
    const { job } = parseCli(['-u', 'https://example.com', '-h', '500'])
    assert.equal(job?.height, 500)
  })

  it('preserves width/height 0 for full-page screenshots', () => {
    const { job } = parseCli(['-u', 'https://example.com', '-w', '0', '-h', '0'])
    assert.equal(job?.width, 0)
    assert.equal(job?.height, 0)
  })

  it('parses clip, crop, auth, and output path', () => {
    const { job } = parseCli([
      '-u',
      'https://google.com',
      '-x',
      '700',
      '-y',
      '190',
      '-w',
      '700',
      '-h',
      '180',
      '-o',
      'google_logo.png',
      '--crop',
      '-a',
      'user:pass',
    ])
    assert.deepEqual(
      {
        url: job?.url,
        x: job?.x,
        y: job?.y,
        width: job?.width,
        height: job?.height,
        path: job?.path,
        ext: job?.ext,
        crop: job?.crop,
        auth: job?.auth,
      },
      {
        url: 'https://google.com',
        x: 700,
        y: 190,
        width: 700,
        height: 180,
        path: 'google_logo',
        ext: 'png',
        crop: true,
        auth: 'user:pass',
      },
    )
  })

  it('exposes debug and chrome path on the program options', () => {
    const { options } = parseCli(['-u', 'https://example.com', '-d', '-p', '/usr/bin/google-chrome'])
    assert.equal(options.debug, true)
    assert.equal(options.path, '/usr/bin/google-chrome')
  })
})

describe('batch parser', () => {
  it('ignores comments and empty lines', () => {
    const jobs = parseBatchContent(`
# full line comment

  # indented comment
-u https://example.com -o one.png
`)
    assert.equal(jobs.length, 1)
    assert.equal(jobs[0].path, 'one')
  })

  it('keeps quoted output paths with spaces', () => {
    const jobs = parseBatchContent('-u https://example.com -o "My Screenshots/home.png"')
    assert.equal(jobs.length, 1)
    assert.equal(jobs[0].path, 'My Screenshots/home')
    assert.equal(jobs[0].ext, 'png')
  })

  it('parses one argument set per line', () => {
    const jobs = parseBatchContent(`
-u https://google.com -x 700 -y 900 -w 700 -h 180 -o google_logo.png --crop
-u github.com -w 0 -h 0 -o full.png
`)
    assert.equal(jobs.length, 2)
    assert.equal(jobs[0].crop, true)
    assert.equal(jobs[0].width, 700)
    assert.equal(jobs[1].url, 'http://github.com')
    assert.equal(jobs[1].width, 0)
    assert.equal(jobs[1].height, 0)
  })

  it('skips lines without a URL', () => {
    const jobs = parseBatchContent('-w 800 -h 600\n-u https://ok.example')
    assert.equal(jobs.length, 1)
    assert.equal(jobs[0].url, 'https://ok.example')
  })

  it('throws when the batch file is missing', () => {
    assert.throws(
      () =>
        jobsFromOptions(
          { batch: 'missing.txt' },
          {
            existsSync: () => false,
            readFileSync: () => {
              throw new Error('should not read')
            },
          },
        ),
      /Batch file "missing.txt" does not exist/,
    )
  })
})
