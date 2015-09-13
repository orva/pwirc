import EventEmitter from 'events'
import R from 'ramda'
import irc from 'irc'

/* TODO list
- (multiple servers)
- (multiple channels)
- (one active channel)
- get initial state (messages from some channel)
- subscribe to message updates to the current channel
*/

const messages = []
const server = 'chat.freenode.net'
const channel = '#nirc-testing'
const client = setupClient()

class ClientSession extends EventEmitter {
  constructor() {
    super()
    this.client = client
    this.channel = channel
    this.server = server
    this.messages = messages
    this.listeners = this._setupChanneEventEmitters()
  }

  close() {
    _removeChannelEventListeners()
    this.messages = undefined
    this.server = undefined
    this.channel = undefined
    this.client = undefined
  }

  _setupChanneEventlEmitters() {
    const channelMsgListener = (from, to, msg) => {
      if (to !== this.channel)
        return

      const message = createMessageObject(this.server, from, to, msg)
      emit('message', message)
    }

    this.client.on('message', channelMsgListener)
    return [[ 'message', channelMsgListener ]]
  }

  _removeChannelEventListeners() {
    R.forEach(listener => {
      const event = R.head(listener)
      const cb = R.last(listener)
      this.client.removeListener(evet, cb)
    }, this.listeners)
  }
}

export function createClientSession() {
  return new ClientSession()
}

function setupClient() {
  const client = new irc.Client(server, 'nirc-test-user', {
    channels: [channel]
  })

  client.addListener('error', err => {
    console.log('error', err)
  })

  client.addListener('message', (from, to, msg) => {
    const message = createMessageObject(server, from, to, msg)
    console.log('message', message)
    messages.push(message)
  })

  return client
}

function createMessageObject(server, from, to, msg) {
  return {
    time: new Date(),
    server: server,
    nick: from,
    to: to,
    msg: msg
  }
}
