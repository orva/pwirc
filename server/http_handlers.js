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
  if (!req.params.server || !req.params.to || !req.body ||
      typeof req.body !== 'object' || !req.body.msg) {
    res.status(404).end()
    return
  }

  const server = findServer(req.params.server)
  irc.say(req.params.to, req.body.msg, server)
  res.status(200).end()
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

  sock.on('join', (serverName, chan) => {
    // TODO how to inform client about error?
    console.log('join', serverName, chan)

    const srv = findServer(serverName)
    if (!srv) return

    irc.join(srv, chan, function() {
      sock.emit('channel-joined', { channels: allChannels(connectedServers) })
    })
  })

  session.events.on('message', msg => {
    sock.emit('message', msg)
  })

  sock.emit('welcome', { channels: allChannels(connectedServers) })
  sock.emit('channel-switched', channel.initialState(session))
})

httpServer.listen(31337, () => {
  console.log('server started, port 31337')
})

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

module.exports = app
