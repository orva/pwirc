const Atom = require('kefir.atom').default
const React = require('karet').default
const K = require('karet.util').default
const R = require('ramda')

const shared = require('./shared')


const JoinDialogue = ({ isOpen }) =>  {
  const state = Atom(emptyState())
  const serverlist = state.view('servers')

  isOpen.onValue(refreshServersWhenOpened(serverlist))

  return <div className={K(isOpen, joinModalClasses)}>
    <input className="input modal-input"
      placeholder="#channelname"
      value={state.view('channel')}
      onChange={ev => state.view('channel').set(ev.target.value)} />

    <dl className="serverlist">
      <dt className="serverlist-term">Connected servers:</dt>
      {K(serverlist.view('connected'), connectedServers(state))}

      <dt className="serverlist-term">Available servers:</dt>
      {K(serverlist, availableServers(state))}
    </dl>

    <input className="input modal-input"
      value={state.view('nick')}
      disabled={K(state.view('requiresServerConnect'), rsc => !rsc)}
      placeholder="nick name"
      onChange={ev => state.view('nick').set(ev.target.value)} />
    <input className="input modal-input"
      value={state.view('realName')}
      disabled={K(state.view('requiresServerConnect'), rsc => !rsc)}
      placeholder="real name"
      onChange={ev => state.view('realName').set(ev.target.value)} />


    <button
      className="button modal-button modal-button-cancel"
      onClick={closeDialogue(state, isOpen)}>
      Cancel
    </button>

    {K(state, s =>
      <button className="button modal-button modal-button-action"
        disabled={cannotJoinYet(s)}
        onClick={joinButtonHandler(state, isOpen)} >
        Join channel
      </button>)}
  </div>
}

const ServerEntry = ({ name, serverUrl, clickHandler, state }) =>
  <dd className={K(state, s => serverlistItemClasses(s, name, serverUrl))}
      onClick={clickHandler} >
    {name}<span className="serverlist-item-url">{serverUrl}</span>
  </dd>


const emptyState = () => ({
  requiresServerConnect: false,
  channel: '',
  server: '',
  serverUrl: '',
  nick: '',
  realName: '',
  servers: {
    connected: [],
    available: {}
  }
})

const joinModalClasses = open =>
  open ? 'modal modal-join' : 'modal modal-join modal--hidden'

const serverlistItemClasses = (state, server, serverUrl) => {
  const normalClasses = 'serverlist-item'
  const selectedClasses = 'serverlist-item serverlist-item--selected'

  if (state.requiresServerConnect) {
    return R.equals(server, state.server) && R.equals(serverUrl, state.serverUrl)
      ? selectedClasses
      : normalClasses
  } else {
    return R.equals(server, state.server)
      ? selectedClasses
      : normalClasses
  }
}

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
    clickHandler={connectedServerClickHandler(state, name)} />)

const availableServers = state => ({ available, connected }) => {
  const pipe = R.pipe(
    filterOutConnected(connected),
    flattenAvailableServers,
    R.map(({name, serverUrl, key}) =>
      <ServerEntry name={name}
        state={state}
        key={key}
        serverUrl={serverUrl}
        clickHandler={availableServerClickHandler(state, name, serverUrl)}/>
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

const connectedServerClickHandler = (state, server) => () => {
  const connected = state.view('servers', 'connected').get()
  const serverInfo = R.find(R.propEq('name', server), connected)

  state.modify(s => R.merge(s, {
    requiresServerConnect: false,
    nick: serverInfo.nick,
    realName: serverInfo.realName,
    server,
  }))
}

const availableServerClickHandler = (state, server, serverUrl) => () =>
  state.modify(s => R.merge(s, {
    requiresServerConnect: true,
    server,
    serverUrl
  }))

const cannotJoinYet = state => {
  return state.requiresServerConnect
    ? !state.channel || !state.server || !state.serverUrl || !state.nick
    : !state.channel || !state.server
}

const joinButtonHandler = (state, isOpen) => () => {
  const connectRequired = state.view('requiresServerConnect').get()
  if (connectRequired) {
    connectServerAndJoinChannel(state, isOpen)
  } else {
    joinChannel(state, isOpen)
  }
}

const joinChannel = (state, isOpen) => {
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

const connectServerAndJoinChannel = (state, isOpen) => {
  const data = state.get()

  const payload = {
    name: data.server,
    serverUrl: data.serverUrl,
    personality: {
      nick: data.nick,
      realName: data.realName || ''
    },
    channels: [data.channel]
  }

  fetch('/servers', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  })
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
