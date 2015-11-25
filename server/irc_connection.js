import EventEmitter from 'events'

import R from 'ramda'
import irc from 'irc'
import uuid from 'uuid'

class Server extends EventEmitter {
  constructor(server, nick, opt) {
    super()
    this.server = server
    this._messages = []
    this._client = new irc.Client(server, nick, opt)
    this._setupServerEventListeners()
  }

  get channels() { return this._client.opt.channels }

  messages(channel) {
    // return R.filter(msg => msg.to === channel, this._messages)
    return R.times(() => {
      return this._createMessageObject('chat.freenode.net', 'banana', channel, 'laaaalaaaalaaaalaaa')
    }, 300)
  }

  _setupServerEventListeners() {
    this._client.addListener('error', err => {
      console.log('error', err)
    })

    this._client.addListener('message', (from, to, msg) => {
      const message = this._createMessageObject(this.server, from, to, msg)
      this._messages.push(message)
      this.emit('message', message)
      console.log('message', message)
    })
  }

  _createMessageObject(server, from, to, msg) {
    return {
      time: new Date(),
      key: uuid.v4(),
      server: server,
      user: from,
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

export function getAllChannels() {
  const chans = R.map(srv => {
    const createChan = R.pipe(
      R.createMapEntry('channel'),
      R.assoc('server', srv.server)
    )
    return R.map(createChan, srv._client.opt.channels)
  }, servers)

  return R.flatten(chans)
}
