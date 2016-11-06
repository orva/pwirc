const Atom = require('kefir.atom').default
const React = require('karet').default  // eslint-disable-line no-unused-vars
const K = require('karet.util').default
const R = require('ramda')

const shared = require('./shared')


const JoinDialogue = ({ isOpen }) =>  { // eslint-disable-line no-unused-vars
  const state = Atom(emptyState())
  const serverlist = state.view('servers')

  isOpen.onValue(refreshServersWhenOpened(serverlist))

  return <div className={K(isOpen, joinModalClasses)}>
    <h4 className="modal-h4">Channel name:</h4>
    <input className="input"
      onChange={ev => state.view('channel').set(ev.target.value)} />

    <h4 className="modal-h4">Select server:</h4>
    <dl className="serverlist">
      <dt className="serverlist-term">Connected servers:</dt>
      {K(serverlist.view('connected'), connectedServers(state))}

      <dt className="serverlist-term">Available servers:</dt>
      {K(serverlist, availableServers(state))}
    </dl>

    <button id="cancel-join-channel-btn"
            className="modal-button modal-button-cancel"
            onClick={closeDialogue(state, isOpen)}>
      Cancel
    </button>

    {K(state, ({ channel, server }) =>
      <button id="join-channel-btn"
        className="modal-button modal-button-action"
        disabled={R.isEmpty(channel) || R.isEmpty(server)}
        onClick={joinChannel(state, isOpen)} >
        Join channel
      </button>)}
  </div>
}

const ServerEntry = ({ name, serverUrl, clickHandler, state }) => // eslint-disable-line no-unused-vars
  <dd className={K(state, s => serverlistItenClasses(s, name))}
      onClick={clickHandler} >
    {name}<span className="serverlist-item-url">{serverUrl}</span>
  </dd>


const emptyState = () => ({
  channel: '',
  server: '',
  servers: {
    connected: [],
    available: {}
  }
})

const joinModalClasses = open =>
  open ? 'modal modal-join' : 'modal modal-join modal--hidden'

const serverlistItenClasses = (state, server) =>
  R.equals(server, state.server)
    ? 'serverlist-item serverlist-item--selected'
    : 'serverlist-item'

const refreshServersWhenOpened = serverlist => isOpen => {
  if (!isOpen) {
    return
  }

  fetch('/servers')
    .then(res => res.json())
    .then(res => serverlist.set(res))
}

const connectedServers = state => R.map(({name, serverUrl}) =>
  <ServerEntry name={name}
    state={state}
    key={shared.dashedKey([name, serverUrl])}
    serverUrl={serverUrl}
    clickHandler={() => state.view('server').set(name)} />)

const availableServers = state => ({ available, connected }) => {
  const pipe = R.pipe(
    filterOutConnected(connected),
    flattenAvailableServers,
    R.map(({name, serverUrl, key}) =>
      <ServerEntry name={name}
        state={state}
        key={key}
        serverUrl={serverUrl}
        clickHandler={() => undefined}/>
    ))

  return pipe(available)
}

const filterOutConnected = R.curry((connected, available) => {
  const keys = R.map(R.prop('name'), connected)
  return R.omit(keys, available)
})

const flattenAvailableServers = R.pipe(
  R.toPairs,
  R.map(([name, urls]) => R.map(serverUrl => ({name, serverUrl}), urls)),
  R.flatten,
  servers => {
    const indices = R.range(0, R.length(servers))
    const addKey = (index, srv) => {
      const key = shared.dashedKey([srv.name, srv.url, index])
      return R.assoc('key', key, srv)
    }
    return R.zipWith(addKey, indices, servers)
  }
)

const joinChannel = (state, isOpen) => () => {
  const data = state.get()
  const server = encodeURIComponent(data.server)
  const channel = encodeURIComponent(data.channel)
  const url = `/channels/${server}/${channel}`

  fetch(url, { method: 'POST' })
    .then(() => {
      state.set(emptyState())
      isOpen.set(false)
    })
}

const closeDialogue = (state, isOpen) => () => {
  isOpen.set(false)
  state.set(emptyState())
}


module.exports = JoinDialogue
