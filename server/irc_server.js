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

const messages = (channel, server) =>
  R.filter(R.propEq('to', channel), server.allMessages)

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
    const message = createMessageObject(server.serverUrl, from, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
  })

  server.irc.addListener('selfMessage', (to, msg) => {
    const nick = server.irc.nick
    const message = createMessageObject(server.serverUrl, nick, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
  })

  server.irc.addListener('join', (chan, nick) => {
    if (nick === server.irc.nick) {
      server.events.emit('channel-joined', chan)
    }
  })

  server.irc.addListener('nick', (oldNick, newNick) => {
    if (oldNick === server.nick) {
      server.nick = newNick
    }
  })
}

const createMessageObject = (serverUrl, from, to, msg) => ({
  time: new Date(),
  key: uuid.v4(),
  server: serverUrl,
  user: from,
  to: to,
  msg: msg
})

module.exports = {
  connect,
  join,
  say,
  messages,
  channels,
  isChannelName
}
