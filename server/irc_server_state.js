const EventEmitter = require('events')
const R = require('ramda')

const irc = require('./irc_server')

function create() {
  return {
    events: new EventEmitter(),
    servers: []
  }
}

function add(state, server) {
  state.servers.push(server)
  state.events.emit('server-added', server)
}

function remove(state, server) {
  const filtered = R.reject(R.equals(server))
  state.servers = filtered
  state.events.emit('server-removed', server)
}

function allChannels(state) {
  const channels = R.map(srv => {
    const createChan = R.pipe(
      R.objOf('channel'),
      R.assoc('server', srv.name)
    )
    return R.map(createChan, irc.channels(srv))
  })

  return R.flatten(channels(state.servers))
}

function isExistingChannel(state, serverName, chan) {
  const server = find(state, serverName)

  return (server &&
    irc.isChannelName(server, chan) &&
    R.contains(chan, irc.channels(server))
  )
}

function find(state, serverName) {
  return R.find(R.propEq('name', serverName), state.servers)
}

module.exports = {
  create,
  add,
  remove,
  allChannels,
  isExistingChannel,
  find
}
