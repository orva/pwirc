import EventEmitter from 'events'
import R from 'ramda'

import * as irc from './irc_connection'

export default class ClientSession extends EventEmitter {
  constructor() {
    super()
    this.server = irc.getServerConnection()
    this.channel = R.head(this.server.channels)
    this.channelListeners = this._setupChannelEventlEmitters()
  }

  close() {
    this._removeChannelEventListeners()
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

  _setupChannelEventlEmitters() {
    const channelMsgListener = msg => {
      if (msg.to === this.channel)
        this.emit('message', msg)
    }

    this.server.on('message', channelMsgListener)
    return [{ type: 'message', cb: channelMsgListener }]
  }

  _removeChannelEventListeners() {
    R.forEach(listener => {
      this.server.removeListener(listener.type, listener.cb)
    }, this.channelListeners)
  }
}
