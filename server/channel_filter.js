import EventEmitter from 'events'
import R from 'ramda'

import * as irc from './irc_server'

/*

We actually want to send only messages to current channel to the client, as it
might be behind mobile connection. Thus we need to store current channel state
per client at server side.

This module wraps current channel state and manages adding/removing event
listeners to correct places.

*/

export function create(server) {
  const channel = R.head(server.client.opt.channels)

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
    lines: irc.messages(session.channel, session.server),
    server: session.server.serverUrl,
    channel: session.channel
  }
}

export function switchChannel(session, channel) {
  if (R.contains(channel, irc.channels(session.server))) {
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
  R.forEach(l => session.server.events.on(l.type, l.callback), listeners)

  return listeners
}

function removeChannelEventListeners(session) {
  R.forEach(listener => {
    session.server.events.removeListener(listener.type, listener.callback)
  }, session.listeners)
}
