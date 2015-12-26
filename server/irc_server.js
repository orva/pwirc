import EventEmitter from 'events'

import R from 'ramda'
import irc from 'irc'
import uuid from 'uuid'

export function connect(name, url, nick, opts) {
  const server = {
    name: name,
    serverUrl: url,
    allMessages: [],
    irc: new irc.Client(url, nick, opts),
    events: new EventEmitter()
  }
  setupServerEventListeners(server)
  return server
}

export function join(server, channel, cb) {
  if (!server || !channel || R.contains(channel, channels(server))) {
    return
  }

  server.irc.join(channel, cb)
}

export function say(target, msg, server) {
  server.irc.say(target, msg)
}

export function messages(channel, server) {
  return R.filter(R.propEq('to', channel), server.allMessages)
}

export function channels(server) {
  return R.keys(server.irc.chans)
}

export function isChannelName(server, name) {
  const chanPrefixes = R.split('', server.irc.supported.channel.types)
  const escaper = R.map(pref => '\\' + pref)
  const escapedChanPrefixes = R.join('', escaper(chanPrefixes))
  const regex = new RegExp('[' + escapedChanPrefixes + '].+')
  return regex.test(name)
}


function setupServerEventListeners(server) {
  server.irc.addListener('error', err => {
    console.log('error', err)
  })

  server.irc.addListener('message', (from, to, msg) => {
    const message = createMessageObject(server.serverUrl, from, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
    console.log('message', message)
  })

  server.irc.addListener('selfMessage', (to, msg) => {
    const nick = server.irc.nick
    const message = createMessageObject(server.serverUrl, nick, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
    console.log('selfMessage', message)
  })

  server.irc.addListener('join', (chan, nick) => {
    if (nick === server.irc.nick) {
      server.events.emit('channel-joined', chan)
    }
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
