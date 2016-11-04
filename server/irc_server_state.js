const EventEmitter = require('events')
const R = require('ramda')

const irc = require('./irc_server')

const create = () => ({
  events: new EventEmitter(),
  servers: []
})

const add = (state, server) => {
  state.servers.push(server)
  state.events.emit('server-added', server)
}

const remove = (state, server) => {
  const filtered = R.reject(R.equals(server))
  state.servers = filtered
  state.events.emit('server-removed', server)
}

const allChannels = state => {
  const channels = R.map(srv =>
    R.map(ch => ({ channel: ch, server: srv.name }), irc.channels(srv)))

  return R.flatten(channels(state.servers))
}

const isExistingChannel = (state, serverName, chan) => {
  const server = find(state, serverName)

  return server &&
    irc.isChannelName(server, chan) &&
    R.contains(chan, irc.channels(server))
}

const find = (state, serverName) =>
  R.find(R.propEq('name', serverName), state.servers)

module.exports = {
  create,
  add,
  remove,
  allChannels,
  isExistingChannel,
  find
}
