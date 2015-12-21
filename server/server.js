import path from 'path'
import http from 'http'
import express from 'express'
import sock from 'socket.io'

import * as connection from './irc_connection'
import * as client from './client_session'

const app = express()
const server = http.Server(app)
const io = sock(server)

app.use(express.static(path.join(__dirname, '../dist')))

io.on('connection', sock => {
  const session = client.create()

  sock.on('disconnect', () => {
    client.close(session)
  })

  sock.on('switch', channel => {
    const state = client.switchChannel(session, channel)
    sock.emit('channel-switched', state)
  })

  sock.on('join', (serverUrl, channel) => {
    console.log('join', serverUrl, channel)
    const srv = connection.getServerConnection(serverUrl)

    // TODO how to inform client about error?
    connection.join(srv, channel, function() {
      sock.emit('channel-joined', { channels: connection.getAllChannels() })
    })
  })

  sock.on('send-message', function(serverUrl, target, msg) {
    console.info('send-message', serverUrl, target, msg)
    connection.message(serverUrl, target, msg)
  })

  session.events.on('message', msg => {
    sock.emit('message', msg)
  })

  sock.emit('welcome', { channels: connection.getAllChannels() })
  sock.emit('channel-switched', client.initialState(session))
})

server.listen(31337, () => {
  console.log('server started, port 31337')
})
