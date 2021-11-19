import { WPC } from '../src/index.js'

const rpc = new WPC(self)
rpc.actions({
  ping: async () => {
    await rpc.emit('pong-event', { isEvent: true })
    return 'pong'
  }
})
