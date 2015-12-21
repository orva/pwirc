import EventEmitter from 'events'
import R from 'ramda'

import * as irc from './irc_connection'

export function create() {
  const server = irc.getServerConnection()
  const channel = R.head(server.channels)

  const session = {
    server: server,
    channel: channel,
    events: new EventEmitter()
  }

  const listeners = setupChannelEventlEmitters(session)
  session.listeners = listeners
  return session
}

export function close(session) {
  removeChannelEventListeners(session)
  session.listeners = undefined
  session.channel = undefined
  session.server = undefined
}

export function initialState(session) {
  return {
    lines: session.server.messages(session.channel),
    server: session.server.serverUrl,
    channel: session.channel
  }
}

export function switchChannel(session, channel) {
  if (R.contains(channel, session.server.channels)) {
    session.channel = channel
    return initialState(session)
  }
}



function setupChannelEventlEmitters(session) {
  const channelMessageListener = msg => {
    if (msg.to === session.channel)
      session.events.emit('message', msg)
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
  }, session.listeners)
}
