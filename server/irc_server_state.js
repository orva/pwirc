import EventEmitter from 'events'
import R from 'ramda'

import * as irc from './irc_server'

export function create() {
  return {
    events: new EventEmitter(),
    servers: []
  }
}

export function add(state, server) {
  state.servers.push(server)
  state.events.emit('server-added', server)
}

export function remove(state, server) {
  const filtered = R.reject(R.equals(server))
  state.servers = filtered
  state.events.emit('server-removed', server)
}

export function allChannels(state) {
  const channels = R.map(srv => {
    const createChan = R.pipe(
      R.objOf('channel'),
      R.assoc('server', srv.name)
    )
    return R.map(createChan, irc.channels(srv))
  })

  return R.flatten(channels(state.servers))
}

export function isExistingChannel(state, serverName, chan) {
  const server = find(state, serverName)

  return (server &&
    irc.isChannelName(server, chan) &&
    R.contains(chan, irc.channels(server))
  )
}

export function find(state, serverName) {
  return R.find(R.propEq('name', serverName), state.servers)
}
