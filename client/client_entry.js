const io = require('socket.io-client')
// const React = require('karet')
const Atom = require('kefir.atom').default
const L = require('partial.lenses')
const R = require('ramda')

const root = Atom({
  messages: [],
  channels: [],
  currentChannel: {}
})

root.log('root')

const messages = root.lens(
  'messages',
  L.required([]))
const channels = root.lens(
  'channels',
  L.required([]),
  L.normalize(R.sortBy(R.prop('channel'))))
const currentChannel = root.lens(
  'currentChannel',
  L.required({}))

const sock = io.connect()
sock.on('channel-switched', chan => {
  messages.remove()
  currentChannel.set(chan)
})
sock.on('channels-updated', chans => channels.set(chans))
sock.on('message', msg => messages.modify(R.append(msg)))
sock.on('welcome', () => console.log('welcome'))
