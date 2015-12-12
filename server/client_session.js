import EventEmitter from 'events'
import R from 'ramda'

import * as irc from './irc_connection'

export default class ClientSession extends EventEmitter {
  constructor() {
    super()
    this.server = irc.getServerConnection()
    this.channel = R.head(this.server.channels)
    this.channelListeners = setupChannelEventlEmitters(this)
  }

  close() {
    removeChannelEventListeners(this)
    this.channelListeners = undefined
    this.channel = undefined
    this.server = undefined
  }

  getInitialState() {
    return { lines: this.server.messages(this.channel) }
  }

  switchChannel(channel) {
    if (R.contains(channel, this.server.channels)) {
      this.channel = channel
      return this.getInitialState()
    }
  }

}

function setupChannelEventlEmitters(session) {
  const channelMessageListener = msg => {
    if (msg.to === session.channel)
    session.emit('message', msg)
  }

  const listeners = [
    { type: 'message', callback: channelMessageListener }
  ]
  R.forEach(l => session.server.on(l.type, l.callback), listeners)

  return listeners
}

function removeChannelEventListeners(session) {
  R.forEach(listener => {
    session.server.removeListener(listener.type, listener.callback)
  }, session.channelListeners)
}
