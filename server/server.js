import path from 'path'
import http from 'http'
import express from 'express'
import sock from 'socket.io'
import R from 'ramda'

import * as irc from './irc_server'
import * as client from './client_session'

// TODO: We actually need some kind of manager that wraps all the server
//       connections, so our client session needs only put listerners to one
//       place.
var connectedServers = [
  irc.connect('chat.freenode.net', 'nirc-test-user', { channels: ['#nirc-testing-1', '#nirc-testing-2'] })
]

const app = express()
const httpServer = http.Server(app)
const io = sock(httpServer)

app.use(express.static(path.join(__dirname, '../dist')))

io.on('connection', sock => {
  const session = client.create(R.head(connectedServers))

  sock.on('disconnect', () => {
    client.close(session)
  })

  sock.on('switch', channel => {
    const state = client.switchChannel(session, channel)
    sock.emit('channel-switched', state)
  })

  sock.on('join', (serverUrl, channel) => {
    // TODO how to inform client about error?
    console.log('join', serverUrl, channel)

    const srv = findServer(serverUrl)
    if (!srv) return

    irc.join(srv, channel, function() {
      sock.emit('channel-joined', { channels: allChannels(connectedServers) })
    })
  })

  sock.on('send-message', function(serverUrl, target, msg) {
    console.info('send-message', serverUrl, target, msg)
    const srv = findServer(serverUrl)
    irc.say(target, msg, srv)
  })

  session.events.on('message', msg => {
    sock.emit('message', msg)
  })

  sock.emit('welcome', { channels: allChannels(connectedServers) })
  sock.emit('channel-switched', client.initialState(session))
})

httpServer.listen(31337, () => {
  console.log('server started, port 31337')
})

function findServer(serverUrl) {
  return R.find(R.propEq('serverUrl', serverUrl), connectedServers)
}

function allChannels(servers) {
  const chans = R.map(srv => {
    const createChan = R.pipe(
      R.createMapEntry('channel'),
      R.assoc('server', srv.serverUrl)
    )
    return R.map(createChan, srv.client.opt.channels)
  }, servers)

  return R.flatten(chans)
}
