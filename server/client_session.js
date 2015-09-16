import EventEmitter from 'events'
import R from 'ramda'

import * as irc from './irc_connection'

export default class ClientSession extends EventEmitter {
  constructor() {
    super()
    this.client = irc.getClient()
    this.channel = R.head(this.client.opt.channels)
    this.server = this.client.opt.server
    this.messages = R.filter(msg => msg.to === this.channel, irc.getMessages())
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
      this.messages = R.filter(msg => msg.to === this.channel, irc.getMessages())
      this._setupChannelEventlEmitters()
      return this.getInitialState()
    }
  }

  _setupChannelEventlEmitters() {
    const channelMsgListener = (from, to, msg) => {
      if (to !== this.channel)
        return

      const message = irc.createMessageObject(this.server, from, to, msg)
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
