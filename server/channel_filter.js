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

export function create(state) {
  const server = R.head(state.servers)
  const channel = R.head(irc.channels(server))

  // This session might have both server and channel as undefined
  const session = {
    server: server,
    channel: channel,
    events: new EventEmitter(),
    state: state
  }

  const stateListeners = setupStateEventListeners(session)
  const listeners = setupChannelEventlEmitters(session)
  session.listeners = listeners
  session.stateListeners = stateListeners
  return session
}

export function close(session) {
  removeStateListeners(session)
  removeChannelEventListeners(session)
  session.listeners = undefined
  session.channel = undefined
  session.server = undefined
}

export function switchChannel(session, channel) {
  if (R.contains(channel, irc.channels(session.server))) {
    session.channel = channel
    return initialState(session)
  }
}


function initialState(session) {
  if (!session.server) {
    return { lines: [], server: undefined, channel: undefined }
  }

  return {
    lines: irc.messages(session.channel, session.server),
    server: session.server.name,
    channel: session.channel
  }
}

function setupChannelEventlEmitters(session) {
  if (!session.server) {
    return
  }

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

function setupStateEventListeners(session) {
  const add = srv => {
    if (!session.server) {
      session.server = srv
      session.channel = R.head(irc.channels(srv))
      setupChannelEventlEmitters(session)
    }
  }

  const listeners = [
    { type: 'server-added', callback: add }
  ]
  R.forEach(l => session.state.events.on(l.type, l.callback), listeners)

  return listeners
}

function removeChannelEventListeners(session) {
  if (!session.server) {
    return
  }

  R.forEach(listener => {
    session.server.events.removeListener(listener.type, listener.callback)
  }, session.listeners)
}

function removeStateListeners(session) {
  if (!session.state) {
    return
  }

  R.forEach(listener => {
    session.state.events.removeListener(listener.type, listener.callback)
  }, session.stateListeners)
}
