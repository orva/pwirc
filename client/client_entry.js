const io = require('socket.io-client')
const Atom = require('kefir.atom').default
const React = require('karet').default  // eslint-disable-line no-unused-vars
const ReactDOM = require('react-dom')
const K = require('karet.util').default
const L = require('partial.lenses')
const R = require('ramda')

const root = Atom({
  messages: [],
  channels: [],
  currentChannel: {}
})

root.log('root')

const messages = root.lens('messages')
const channels = root.lens(
  'channels',
  L.normalize(R.sortBy(R.prop('channel'))))
const currentChannel = root.lens('currentChannel')


const sock = io.connect()
sock.on('channel-switched', ({lines, server, channel}) => {
  messages.set(lines)
  currentChannel.set({ server, channel })
})
sock.on('channels-updated', chans => channels.set(chans))
sock.on('message', msg => messages.modify(R.append(msg)))
sock.on('welcome', () => console.log('welcome'))


const Messages = ({msgs}) => // eslint-disable-line no-unused-vars
  <ul className="messages">
   { K(msgs, R.map(({key, user, msg}) => <li key={key}>{user} {msg}</li>)) }
  </ul>

const Channels = ({chans}) => // eslint-disable-line no-unused-vars
  <ul className="channels">
   { K(chans, R.map(({channel, server, key=R.reduce(R.concat, '', [server, '-', channel])}) => <li key={key}>{channel}</li>)) }
  </ul>

ReactDOM.render(
  <Channels chans={channels} />,
  document.getElementById('channels-area'))

ReactDOM.render(
  <Messages msgs={messages} />,
  document.getElementById('messages-area'))


