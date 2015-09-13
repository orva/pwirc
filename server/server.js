import path from 'path'
import http from 'http'
import express from 'express'
import sock from 'socket.io'

import * as irc from './irc_connection'

const app = express()
const server = http.Server(app)
const io = sock(server)

app.use(express.static(path.join(__dirname, '../dist')))

io.on('connection', sock => {
  const session = irc.createClientSession()

  sock.on('disconnect', () => {
    session.close()
  })

  session.on('message', msg => {
    sock.emit('message', msg)
  })

  sock.emit('welcome', session.getInitialState())
})

server.listen(31337, () => {
  console.log('server starter, port 31337')
})
