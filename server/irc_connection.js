import EventEmitter from 'events'

import R from 'ramda'
import irc from 'irc'
import uuid from 'uuid'

class Server extends EventEmitter {
  constructor(server, nick, opt) {
    super()
    this.server = server
    this.messages = []
    this._client = new irc.Client(server, nick, opt)
    this._setupServerEventListeners()
  }

  get channels() { return this._client.opt.channels }

  _setupServerEventListeners() {
    this._client.addListener('error', err => {
      console.log('error', err)
    })

    this._client.addListener('message', (from, to, msg) => {
      const message = this._createMessageObject(this.server, from, to, msg)
      this.messages.push(message)
      this.emit('message', message)
      console.log('message', message)
    })
  }

  _createMessageObject(server, from, to, msg) {
    return {
      time: new Date(),
      key: uuid.v4(),
      server: server,
      nick: from,
      to: to,
      msg: msg
    }
  }
}

var servers = [
  new Server('chat.freenode.net', 'nirc-test-user', { channels: ['#nirc-testing-1', '#nirc-testing-2'] })
]

export function getServerConnection(server) {
  if (!server)
    return R.head(servers)
  else
    return R.find(srv => srv.server == server, servers)
}
