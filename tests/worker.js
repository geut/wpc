import { WPC } from '../src/index.js'

const rpc = new WPC(self)
rpc.actions({
  ping: () => 'pong'
})
