const isTransfer = Symbol('is-transfer')

class UUID {
  constructor (generate) {
    this._generate = generate
    this._free = []
  }

  get () {
    if (!this._free.length) {
      return this._generate()
    }

    return this._free.pop()
  }

  release (id) {
    this._free.push(id)
  }
}

export const transfer = (data, transferable) => {
  return {
    [isTransfer]: true,
    data,
    transferable
  }
}

export class WPC {
  constructor (port, onmessage) {
    this._port = port
    this._requests = new Map()
    this._actions = new Map()
    this._uuid = new UUID(() => this._requests.size)
    this._port.onmessage = async ev => {
      if (ev.data?.requestId === undefined) return onmessage && onmessage(ev)

      if (!ev.data.action) {
        return this._handleResponse(ev.data)
      }

      const { requestId, action, data } = ev.data
      let result
      let error
      try {
        result = await this._actions.get(action)(data)
      } catch (err) {
        error = err
      }

      const response = { requestId }

      if (error) {
        response.error = error.message + '\n' + error.stack
        this._port.postMessage(response)
        return
      }

      if (result?.[isTransfer]) {
        response.data = result.data
        this._port.postMessage(response, result.transferable)
        return
      }

      response.data = result
      this._port.postMessage(response)
    }
  }

  async call (action, data, timeout) {
    if (this._closed) return

    const requestId = this._uuid.get()

    const request = {}
    request.promise = new Promise((resolve, reject) => {
      let timer
      let done = false
      if (timeout) {
        timer = setTimeout(() => {
          request.reject(new Error('WPC timeout'))
        }, timeout)
      }

      request.resolve = (data) => {
        if (done) return
        this._uuid.release(requestId)
        done = true
        timer && clearTimeout(timer)
        resolve(data)
      }

      request.reject = err => {
        if (done) return
        this._uuid.release(requestId)
        done = true
        timer && clearTimeout(timer)
        reject(err)
      }
    })

    this._requests.set(requestId, request)

    if (data?.[isTransfer]) {
      this._port.postMessage({ requestId, action, data: data.data }, data.transferable)
    } else {
      this._port.postMessage({ requestId, action, data })
    }

    return request.promise
  }

  actions (actions) {
    Object.keys(actions).forEach(key => {
      this._actions.set(key, actions[key])
    })
  }

  close () {
    this._port.onmessage = null

    if (this._port.close) {
      this._port.close()
    } else if (this._port.terminate) {
      this._port.terminate()
    }

    this._closed = true
  }

  _handleResponse (response) {
    const { requestId, data, error } = response

    const request = this._requests.get(requestId)
    if (!request) return

    if (error) {
      request.reject(new Error(error))
      return
    }

    request.resolve(data)
  }
}
