import EventEmitter from 'events'
import R from 'ramda'
import irc from 'irc'
import uuid from 'uuid'

/* TODO list
- (multiple servers)
- (multiple channels)
- (one active channel)
- get initial state (messages from some channel)
- subscribe to message updates to the current channel
*/

const messages = []
const server = 'chat.freenode.net'
const channels = ['#nirc-testing-1', '#nirc-testing-2']
const client = setupClient()

export function createClientSession() {
  return new ClientSession()
}

class ClientSession extends EventEmitter {
  constructor() {
    super()
    this.client = client
    this.channel = R.head(channels)
    this.server = server
    this.messages = R.filter(msg => msg.to === this.channel, messages)
    this.channelListeners = this._setupChannelEventlEmitters()
  }

  close() {
    this._removeChannelEventListeners()
    this.channelListeners = undefined
    this.messages = undefined
    this.server = undefined
    this.channel = undefined
    this.client = undefined
    console.log('session closed')
  }

  getInitialState() {
    return { lines: this.messages }
  }

  switchChannel(channel) {
    if (R.contains(channel, this.client.opt.channels)) {
      this._removeChannelEventListeners()
      this.channel = channel
      this.messages = R.filter(msg => msg.to === this.channel, messages)
      this._setupChannelEventlEmitters()
      return this.getInitialState()
    }
  }

  _setupChannelEventlEmitters() {
    const channelMsgListener = (from, to, msg) => {
      if (to !== this.channel)
        return

      const message = createMessageObject(this.server, from, to, msg)
      this.emit('message', message)
    }

    this.client.on('message', channelMsgListener)
    return [{ type: 'message', cb: channelMsgListener }]
  }

  _removeChannelEventListeners() {
    R.forEach(listener => {
      this.client.removeListener(listener.type, listener.cb)
    }, this.channelListeners)
  }
}

function setupClient() {
  const client = new irc.Client(server, 'nirc-test-user', {
    channels: channels
  })

  client.addListener('error', err => {
    console.log('error', err)
  })

  client.addListener('message', (from, to, msg) => {
    const message = createMessageObject(server, from, to, msg)
    messages.push(message)
    console.log('message', message)
  })

  return client
}

function createMessageObject(server, from, to, msg) {
  return {
    time: new Date(),
    key: uuid.v4(),
    server: server,
    nick: from,
    to: to,
    msg: msg
  }
}
