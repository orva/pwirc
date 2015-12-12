import EventEmitter from 'events'

import R from 'ramda'
import irc from 'irc'
import uuid from 'uuid'

export function getServerConnection(serverUrl) {
  if (!serverUrl)
    return R.head(servers)
  else
    return R.find(srv => srv.serverUrl === serverUrl, servers)
}

export function getAllChannels() {
  const chans = R.map(srv => {
    const createChan = R.pipe(
      R.createMapEntry('channel'),
      R.assoc('server', srv.serverUrl)
    )
    return R.map(createChan, srv.client.opt.channels)
  }, servers)

  return R.flatten(chans)
}

export function join(server, channel, cb) {
  if (!server || !channel) {
    return
  }

  const existingChans = server.channels
  if (R.contains(channel, existingChans)) {
    return
  }

  server.client.join(channel, cb)
}

class Server extends EventEmitter {
  constructor(serverUrl, nick, opt) {
    super()
    this.serverUrl = serverUrl
    this.allMessages = []
    this.client = new irc.Client(serverUrl, nick, opt)
    setupServerEventListeners(this)
  }

  get channels() { return this.client.opt.channels }

  messages(channel) {
    // return R.filter(msg => msg.to === channel, this.allMessages)
    return R.times(() => {
      return createMessageObject('chat.freenode.net', 'banana', channel, 'laaaalaaaalaaaalaaa')
    }, 300)
  }
}

var servers = [
  new Server('chat.freenode.net', 'nirc-test-user', { channels: ['#nirc-testing-1', '#nirc-testing-2'] })
]

function setupServerEventListeners(server) {
  server.client.addListener('error', err => {
    console.log('error', err)
  })

  server.client.addListener('message', (from, to, msg) => {
    const message = createMessageObject(server.serverUrl, from, to, msg)
    server.allMessages.push(message)
    server.emit('message', message)
    console.log('message', message)
  })
}

function createMessageObject(serverUrl, from, to, msg) {
  return {
    time: new Date(),
    key: uuid.v4(),
    server: serverUrl,
    user: from,
    to: to,
    msg: msg
  }
}
