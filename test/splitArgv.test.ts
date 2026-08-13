import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { splitArgv } from '../src/splitArgv'

describe('splitArgv', () => {
  it('splits on whitespace', () => {
    assert.deepEqual(splitArgv('-u https://example.com -w 800'), ['-u', 'https://example.com', '-w', '800'])
  })

  it('keeps quoted paths with spaces', () => {
    assert.deepEqual(splitArgv('-o "My Screenshots/home.png" -u example.com'), [
      '-o',
      'My Screenshots/home.png',
      '-u',
      'example.com',
    ])
  })

  it('keeps single-quoted tokens', () => {
    assert.deepEqual(splitArgv("-o 'folder with spaces/out.png'"), ['-o', 'folder with spaces/out.png'])
  })

  it('treats backslash as an escape outside single quotes', () => {
    assert.deepEqual(splitArgv('-o My\\ Screenshots/out.png'), ['-o', 'My Screenshots/out.png'])
  })

  it('collapses extra whitespace', () => {
    assert.deepEqual(splitArgv('  -u   example.com   -c  '), ['-u', 'example.com', '-c'])
  })
})
