import path from 'path'
import http from 'http'
import express from 'express'
import bodyParser from 'body-parser'
import SocketIO from 'socket.io'
import R from 'ramda'

import * as irc from './irc_server'
import * as channel from './channel_filter'

const app = express()
const httpServer = http.Server(app)
const io = SocketIO(httpServer)


// TODO: We actually need some kind of manager that wraps all the server
//       connections, so our client session needs only put listerners to one
//       place.
var connectedServers = [
  irc.connect('freenode', 'chat.freenode.net', 'nirc-test-user', { channels: ['#nirc-testing-1', '#nirc-testing-2'] })
]

app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, '../dist')))
app.use(bodyParser.json())

app.post('/messages/:server/:to', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || !req.body.msg) {
    res.status(404).end()
    return
  }

  const server = findServer(req.params.server)
  if (!server) {
    res.status(404).end()
    return
  }

  // If target is channel, it needs to exist
  if (irc.isChannelName(server, req.params.to) &&
      !R.contains(req.params.to, irc.channels(server))) {
    res.status(404).end()
    return
  }

  irc.say(req.params.to, req.body.msg, server)
  res.status(200).end()
})

app.post('/channels/:server/:chan', (req, res) => {
  const server = findServer(req.params.server)
  if (!server ||
      !irc.isChannelName(server, req.params.chan) ||
      isExistingChannel(req.params.server, req.params.chan)) {
    res.status(404).end()
    return
  }

  irc.join(server, req.params.chan)
  res.status(200).end()
})

app.get('/channels/:server/:chan', (req, res) => {
  if (!req.accepts('html') ||
      !isExistingChannel(req.params.server, req.params.chan)) {
    res.status(404).end()
    return
  }

  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

io.on('connection', sock => {
  const session = channel.create(R.head(connectedServers))

  sock.on('disconnect', () => {
    channel.close(session)
  })

  sock.on('switch', chan => {
    const state = channel.switchChannel(session, chan)
    sock.emit('channel-switched', state)
  })

  session.events.on('message', msg => {
    sock.emit('message', msg)
  })

  sock.emit('channels-updated', allChannels(connectedServers))
  sock.emit('welcome')
})

R.forEach(R.curry(serverBroadcasts)(io), connectedServers)

httpServer.listen(31337, () => {
  console.log('server started, port 31337')
})

function serverBroadcasts(sockIO, server) {
  server.events.on('channel-joined', () => {
    sockIO.emit('channel-joined', { channels: allChannels(connectedServers) })
  })
}

function findServer(serverName) {
  return R.find(R.propEq('name', serverName), connectedServers)
}

function allChannels(servers) {
  const chans = R.map(srv => {
    const createChan = R.pipe(
      R.createMapEntry('channel'),
      R.assoc('server', srv.name)
    )
    return R.map(createChan, irc.channels(srv))
  }, servers)

  return R.flatten(chans)
}

function isExistingChannel(serverName, chan) {
  const server = findServer(serverName)

  return (server &&
    irc.isChannelName(server, chan) &&
    R.contains(chan, irc.channels(server))
  )
}

module.exports = app
