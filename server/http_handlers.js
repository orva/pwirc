import path from 'path'
import http from 'http'
import express from 'express'
import bodyParser from 'body-parser'
import SocketIO from 'socket.io'
import R from 'ramda'
import Promise from 'bluebird'

import * as irc from './irc_server'
import * as serverState from './irc_server_state'
import * as channel from './channel_filter'
import * as config from './config'

const configFile = path.join(__dirname, '../data/configuration.json')

const app = express()
const httpServer = http.Server(app)
const io = SocketIO(httpServer)

const servers = serverState.create()

servers.events.on('server-added', srv => {
  serverBroadcasts(io, srv)
  io.emit('channels-updated', serverState.allChannels(servers))
})


app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, '../dist')))
app.use(bodyParser.json())

app.post('/messages/:server/:to', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || !req.body.msg) {
    res.status(404).end()
    return
  }

  const server = serverState.find(servers, req.params.server)
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
  const server = serverState.find(servers, req.params.server)
  if (!server ||
      !irc.isChannelName(server, req.params.chan) ||
      serverState.isExistingChannel(servers, req.params.server, req.params.chan)) {
    res.status(404).end()
    return
  }

  irc.join(server, req.params.chan)
  res.status(200).end()
})

app.get('/channels/:server/:chan', (req, res) => {
  if (!req.accepts('html') ||
      !serverState.isExistingChannel(servers, req.params.server, req.params.chan)) {
    res.status(404).end()
    return
  }

  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.get('/servers', (req, res) => {
  config.load(configFile)
    .then(conf => {
      const connected = R.map(R.pick(['name', 'serverUrl']), servers.servers)
      const available = conf.servers
      res.json({
        connected: connected,
        available: available
      })
    })
})


io.on('connection', sock => {
  const session = channel.create(R.head(servers.servers))

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

  sock.emit('channels-updated', serverState.allChannels(servers))
  sock.emit('welcome')
})



config.load(configFile)
  .then(conf => {
    console.log('Following config loaded:', conf)

    const connected = R.prop('connected', conf) || []
    const ircs = R.map(reconnectIrcServer, connected)
    R.forEach(R.curry(serverState.add)(servers), ircs)

    const listen = Promise.promisify(httpServer.listen).bind(httpServer)
    return listen(31337)
  })
  .tap(() => {
    console.log('server started, port 31337')
  })

function reconnectIrcServer(con) {
  return irc.connect(con.serverName, con.serverUrl, con.nick,
    { channels: con.channels})
}

function serverBroadcasts(sockIO, server) {
  server.events.on('channel-joined', () => {
    sockIO.emit('channels-updated', serverState.allChannels(servers))
  })
}


module.exports = app
