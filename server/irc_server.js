import EventEmitter from 'events'

import R from 'ramda'
import irc from 'irc'
import uuid from 'uuid'

export function connect(url, nick, opts) {
  const server = {
    serverUrl: url,
    allMessages: [],
    client: new irc.Client(url, nick, opts),
    events: new EventEmitter()
  }
  setupServerEventListeners(server)
  return server
}

export function join(server, channel, cb) {
  if (!server || !channel || R.contains(channel, channels(server))) {
    return
  }

  server.client.join(channel, cb)
}

export function say(target, msg, server) {
  server.client.say(target, msg)
}

export function messages(channel, server) {
  return R.filter(R.propEq('to', channel), server.allMessages)
}

export function channels(server) {
  // TODO: use server.client.channels, requires join event handling
  return server.client.opt.channels
}



function setupServerEventListeners(server) {
  server.client.addListener('error', err => {
    console.log('error', err)
  })

  server.client.addListener('message', (from, to, msg) => {
    const message = createMessageObject(server.serverUrl, from, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
    console.log('message', message)
  })

  server.client.addListener('selfMessage', (to, msg) => {
    const nick = server.client.nick
    const message = createMessageObject(server.serverUrl, nick, to, msg)
    server.allMessages.push(message)
    server.events.emit('message', message)
    console.log('selfMessage', message)
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
