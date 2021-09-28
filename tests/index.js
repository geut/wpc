import { test } from 'uvu'
import * as assert from 'uvu/assert'
import Worker from 'web-worker'

import { WPC } from '../src/index.js'

test('basic', async () => {
  const worker = new Worker('./tests/worker.js', { type: 'module' })
  const rpc = new WPC(worker)
  assert.is(await rpc.call('ping'), 'pong')
  rpc.close()
})

test.run()
