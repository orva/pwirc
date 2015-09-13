import path from 'path'
import http from 'http'
import express from 'express'
import sock from 'socket.io'
import Chance from 'chance'
import R from 'ramda'

const app = express()
const server = http.Server(app)
const io = sock(server)

app.use(express.static(path.join(__dirname, '../dist')))

function createMockedMessages() {
  const chance = Chance()
  const lines = R.times(index => {
    return {
      msg: chance.sentence(),
      user: chance.first(),
      time: chance.date({year: 2015}),
      key: index
    }
  }, 200)

  return lines
}

io.on('connection', sock => {
  sock.emit('welcome', { lines: createMockedMessages() })
})

server.listen(31337, () => {
  console.log('server starter, port 31337')
})
