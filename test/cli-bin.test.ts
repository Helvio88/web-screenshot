import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { describe, it } from 'node:test'

describe('built CLI', () => {
  it('prints help without launching a browser', { skip: !existsSync('dist/screenshot.js') }, () => {
    const result = spawnSync(process.execPath, ['dist/screenshot.js', '--help'], {
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Usage: web-screenshot \[options\]/)
    assert.match(result.stdout, /-u, --url <url>/)
    assert.match(result.stdout, /-p, --path \[path\]/)
    assert.match(result.stdout, /-s, --wait-for <selector>/)
    assert.match(result.stdout, /--cookies <file>/)
  })

  it('prints the package version', { skip: !existsSync('dist/screenshot.js') }, () => {
    const result = spawnSync(process.execPath, ['dist/screenshot.js', '--version'], {
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/)
  })

  it('errors when neither --url nor --batch is given', { skip: !existsSync('dist/screenshot.js') }, () => {
    const result = spawnSync(process.execPath, ['dist/screenshot.js'], {
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, /--url/)
  })
})
