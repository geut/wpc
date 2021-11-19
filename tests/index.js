import { test } from 'uvu'
import * as assert from 'uvu/assert'
import Worker from 'web-worker'

import { WPC } from '../src/index.js'

test('basic', async () => {
  const worker = new Worker('./tests/worker.js', { type: 'module' })
  const rpc = new WPC(worker)
  const event = rpc.once('pong-event')
  assert.is(await rpc.call('ping'), 'pong')
  assert.equal(await event, { isEvent: true })
  console.log(rpc._events)
  rpc.close()
})

test.run()
