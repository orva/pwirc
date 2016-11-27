const EventEmitter = require('events')
const R = require('ramda')

const irc = require('./irc_server')
const servers = require('./irc_server_state')

/*

We actually want to send only messages to current channel to the client, as it
might be behind mobile connection. Thus we need to store current channel state
per client at server side.

This module wraps current channel state and manages adding/removing event
listeners to correct places.

*/

const create = state => {
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

const close = session => {
  removeStateListeners(session)
  removeChannelEventListeners(session)
  session.listeners = undefined
  session.channel = undefined
  session.server = undefined
}

const switchChannel = (session, chan) => {
  const allChannels = servers.allChannels(session.state)
  const targetChan = R.find(R.equals(chan), allChannels)

  if (!targetChan) {
    return
  }

  if (session.server.name === targetChan.server) {
    session.channel = targetChan.channel
    return initialState(session)
  }

  const server = servers.find(session.state, targetChan.server)
  removeChannelEventListeners(session)
  session.server = server
  session.channel = targetChan.channel
  session.listeners = setupChannelEventlEmitters(session)

  return initialState(session)
}


const initialState = session => {
  if (!session.server) {
    return { lines: [], server: undefined, channel: undefined }
  }

  return {
    lines: irc.messages(session.channel, session.server),
    server: session.server.name,
    channel: session.channel
  }
}

const setupChannelEventlEmitters = session => {
  if (!session.server) {
    return
  }

  const channelMessageListener = msg => {
    if (msg.to === session.channel)
      session.events.emit('message', msg)
  }

  const listeners = [
    { type: 'message', callback: channelMessageListener },
    { type: 'private-message', callback: eventForwarder(session, 'private-message') },
    { type: 'names', callback: eventForwarder(session, 'names') },
    { type: 'event-join', callback: eventForwarder(session, 'event-join') }
  ]
  R.forEach(l => session.server.events.on(l.type, l.callback), listeners)

  return listeners
}

const eventForwarder = (session, type) => payload => session.events.emit(type, payload)

const setupStateEventListeners = session => {
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

const removeChannelEventListeners = session => {
  if (!session.server) {
    return
  }

  const listeners = session.listeners
  session.listeners = []

  R.forEach(listener => {
    session.server.events.removeListener(listener.type, listener.callback)
  }, listeners)

}

const removeStateListeners = session => {
  if (!session.state) {
    return
  }

  const stateListeners = session.stateListeners
  session.stateListeners = []

  R.forEach(listener => {
    session.state.events.removeListener(listener.type, listener.callback)
  }, stateListeners)
}

module.exports = {
  create,
  close,
  switchChannel,
  initialState
}
