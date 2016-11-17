const io = require('socket.io-client')
const Atom = require('kefir.atom').default
const React = require('karet').default  // eslint-disable-line no-unused-vars
const ReactDOM = require('react-dom')
const K = require('karet.util').default
const L = require('partial.lenses')
const R = require('ramda')

const shared = require('./shared')
const JoinDialogue = require('./join_dialogue') // eslint-disable-line no-unused-vars

const root = Atom({
  messages: [],
  channels: [],
  currentChannel: {
    server: '',
    channel: ''
  },
  openModals: {
    join: false,
    sidepanel: false,
  }
})

const messages = root.view('messages')
const channels = root.view(
  'channels',
  L.normalize(R.sortBy(R.prop('channel'))))

const currentChannel = root.view('currentChannel')
const joinDialogueOpen = root.view('openModals', 'join')
const sidebarOpen = root.view('openModals', 'sidepanel')


const sock = io.connect()
sock.on('channel-switched', ({lines, server, channel}) => {
  messages.set(lines)
  currentChannel.set({ server, channel })
})
sock.on('channels-updated', chans => channels.set(chans))
sock.on('message', msg => messages.modify(R.append(msg)))
sock.on('welcome', () => {
  console.log('welcome')
})


const Messages = ({ msgs }) => // eslint-disable-line no-unused-vars
  <ul className="messages">
    {K(msgs, R.map(({key, time, user, msg}) =>
      <li key={key} className="messages-msg">
        <span className="messages-msg-timestamp">{formatTimestamp(time)}</span>
        <span className="messages-msg-user">{user}</span> {msg}
      </li>))}
  </ul>

const formatTimestamp = timeStr => {
  try {
    const d = new Date(timeStr)
    return R.join(':', [
      padTimePart(d.getHours()),
      padTimePart(d.getMinutes()),
      padTimePart(d.getSeconds())])
  } catch (e) {
    return '??:??:??'
  }
}

const padTimePart = str => leftPad(2, '0', '' + str)

const leftPad = (paddedLength, padder, str) => {
  if (str.length >= paddedLength) {
    return str
  }

  const padAmount = paddedLength - str.length
  return R.concat(
    R.join('', R.repeat(padder, padAmount)),
    str
  )
}


const Channels = ({ chans }) => // eslint-disable-line no-unused-vars
  <div className="sidepanel">
    <h3 className="sidepanel-header">
      Channels
      <a title="Join to a new channel">
        <i className="sidepanel-header-glyph fa fa-plus-circle"
          onClick={() => joinDialogueOpen.set(true)}></i>
      </a>
    </h3>
    <ul className="channels">
      {K(chans, R.map(({channel, server, key=shared.dashedKey([channel, server])}) =>
        <li key={key} className="channels-chan" onClick={switchChannel(channel, server)}>
          {channel}
        </li>))}
    </ul>
  </div>

const switchChannel = (channel, server) => e => {
  e.preventDefault()
  sock.emit('switch', { channel, server })
}


const Input = ({ currentChan }) => { // eslint-disable-line no-unused-vars
  const state = Atom({
    msg: ''
  })

  return <div className="input-bar">
      <a title="Open sidepanel">
        <i className="input-bar-menu-open-glyph fa fa-bars"
          onClick={() => sidebarOpen.set(true)}></i>
      </a>
      <input className="input input-bar-input"
        value={ state.view('msg') }
        onInput={ e => state.view('msg').set(e.target.value) }
        onKeyPress={keypressHandler(state, currentChan)} />
    </div>
}

const keypressHandler = (state, currentChan) => e => {
  if (e.key !== 'Enter') {
    return
  }

  const chanData = currentChan.get()
  const server = encodeURIComponent(chanData.server)
  const channel = encodeURIComponent(chanData.channel)
  const url = `/messages/${server}/${channel}`

  const msg = state.view('msg')
  const payload = { msg: msg.get() }

  fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(() => msg.set(''))
}


// This is pretty annoying hack: we need to set class to the sidepanel-area DOM
// node which is parent for the Channels component. This is because we want to
// have normal DOM flow in desktop and `position: fixed; translate` goodness in
// mobile. Without using cascading style rules.
sidebarOpen.onValue(open => {
  const sidepanelArea = document.getElementsByClassName('sidepanel-area').item(0)
  const openClass = 'sidepanel-area--open'

  if (open) {
    sidepanelArea.classList.add(openClass)
  } else {
    sidepanelArea.classList.remove(openClass)
  }
})

ReactDOM.render(
  <Channels chans={channels} />,
  document.getElementsByClassName('sidepanel-area').item(0))

ReactDOM.render(
  <Messages msgs={messages} />,
  document.getElementsByClassName('messages-area').item(0))

ReactDOM.render(
  <Input currentChan={currentChannel} />,
  document.getElementsByClassName('input-area').item(0))

ReactDOM.render(
  <JoinDialogue isOpen={joinDialogueOpen} />,
  document.getElementsByClassName('modal-area').item(0))
