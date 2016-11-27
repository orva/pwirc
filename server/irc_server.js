const EventEmitter = require('events')

const R = require('ramda')
const irc = require('irc')
const uuid = require('uuid')

const connect = (name, url, nick, opts) => {
  // TODO promisify
  const server = {
    name: name,
    nick: nick,
    realName: opts.realName || '',
    serverUrl: url,
    allMessages: [],
    privateMessages: [],
    names: {},
    irc: new irc.Client(url, nick, opts),
    events: new EventEmitter()
  }
  setupServerEventListeners(server)
  return server
}

const join = (server, channel, cb) => {
  if (!server || !channel || R.contains(channel, channels(server)) ||
      !isChannelName(server, channel)) {
    return
  }

  server.irc.join(channel, cb)
}

const say = (target, msg, server) =>
  server.irc.say(target, msg)

const messages = (to, server) =>
  isChannelName(server, to)
    ? R.filter(R.propEq('to', to), server.allMessages)
    : R.filter(msg => (msg.to === to || msg.user === to), server.privateMessages)

const channels = server => {
  if (!server) {
    return []
  }

  return R.keys(server.irc.chans)
}

const isChannelName = (server, name) => {
  const chanPrefixes = R.split('', server.irc.supported.channel.types)
  const escaper = R.map(pref => '\\' + pref)
  const escapedChanPrefixes = R.join('', escaper(chanPrefixes))
  const regex = new RegExp('[' + escapedChanPrefixes + '].+')
  return regex.test(name)
}


const setupServerEventListeners = server => {
  server.irc.addListener('error', err => {
    // TODO server-disconnected event
    console.log('error', err)
  })

  server.irc.addListener('message', (from, to, msg) => {
    if (from === server.irc.nick) {
      return
    }

    const message = createMessageObject(server.serverUrl, from, false, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
  })

  server.irc.addListener('selfMessage', (to, msg) => {
    const nick = server.irc.nick
    const message = createMessageObject(server.serverUrl, nick, true, to, msg)

    if (isChannelName(server, to)) {
      server.allMessages.push(message)
      server.events.emit('message', message)
    } else {
      server.privateMessages.push(message)
      server.events.emit('private-message', message)
    }
  })

  server.irc.addListener('join', (channel, nick) => {
    if (nick === server.irc.nick) {
      server.events.emit('channel-joined', channel)
    } else {
      const existingNameObj = server.names[channel] || {}
      const updatedNameObj = R.merge(existingNameObj, { [nick]: '' })
      const names = { [channel]: updatedNameObj }
      server.names = R.merge(server.names, names)

      server.events.emit('event-join', { channel, nick })
      server.events.emit('names', names)
    }
  })

  server.irc.addListener('part', (channel, nick, reason) => {
    if (nick === server.irc.nick) {
      server.names = R.omit(channel, server.names)
      server.events.emit('channel-parted', channel)
    }
  })

  server.irc.addListener('nick', (oldNick, newNick) => {
    if (oldNick === server.nick) {
      server.nick = newNick
    }
  })

  server.irc.addListener('names', (channel, nameobject) => {
    const names = { [channel]: nameobject }
    server.names = R.merge(server.names, names)
    server.events.emit('names', names)
  })

  server.irc.addListener('pm', (from, msg) => {
    const nick = server.irc.nick
    const message = createMessageObject(server.serverUrl, from, false, nick, msg)

    server.privateMessages.push(message)
    server.events.emit('private-message', message)
  })
}

const createMessageObject = (serverUrl, from, selfMessage, to, msg) => ({
  time: new Date(),
  key: uuid.v4(),
  server: serverUrl,
  user: from,
  selfMessage,
  to,
  msg
})

module.exports = {
  connect,
  join,
  say,
  messages,
  channels,
  isChannelName
}
