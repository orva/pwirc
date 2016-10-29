const Atom = require('kefir.atom').default
const React = require('karet').default  // eslint-disable-line no-unused-vars
const K = require('karet.util').default
const R = require('ramda')


const dashedKey = R.pipe(
  R.reject(R.isNil),
  R.intersperse('-'),
  R.join(''))

const filterOutConnected = R.curry((connected, available) => {
  const keys = R.map(R.prop('name'), connected)
  return R.omit(keys, available)
})

const flattenAvailableServers = R.pipe(
  R.toPairs,
  R.map(([name, urls]) => R.map(serverUrl => ({name, serverUrl}), urls)),
  R.flatten,
  srvs => {
    const indices = R.range(0, R.length(srvs))
    const addKey = (index, srv) => {
      const key = dashedKey([srv.name, srv.url, index])
      return R.assoc('key', key, srv)
    }
    return R.zipWith(addKey, indices, srvs)
  }
)

const availableServers = (state, {available, connected}) => {
  const pipe = R.pipe(
    filterOutConnected(connected),
    flattenAvailableServers,
    R.map(({name, serverUrl, key}) =>
      <ServerEntry name={name}
                   state={state}
                   key={key}
                   serverUrl={serverUrl}
                   clickHandler={() => undefined}/>))
  return pipe(available)
}

const emptyState = () => ({channel: '', server: ''})

const joinChannel = (state, join) => () => {
  const data = state.get()
  const server = encodeURIComponent(data.server)
  const channel = encodeURIComponent(data.channel)
  const url = `/channels/${server}/${channel}`

  fetch(url, { method: 'POST' })
    .then(() => {
      state.set(emptyState())
      join.set(false)
    })
}

const closeDialogue = (state, join) => () => {
  join.set(false)
  state.set(emptyState())
}

const joinModalClasses = open =>
  open ? 'modal modal-join' : 'modal modal-join modal--hidden'

const serverlistItenClasses = (state, server) =>
  R.equals(server, state.server)
    ? 'serverlist-item serverlist-item--selected'
    : 'serverlist-item'

const ServerEntry = ({name, serverUrl, clickHandler, state}) => // eslint-disable-line no-unused-vars
  <dd className={K(state, s => serverlistItenClasses(s, name))}
      onClick={clickHandler} >
    {name}<span className="serverlist-item-url">{serverUrl}</span>
  </dd>

const JoinDialogue = ({ join, serverList }) =>  { // eslint-disable-line no-unused-vars
  const state = new Atom(emptyState())

  return <div className={K(join, joinModalClasses)}>
    <h4 className="modal-h4">Channelname:</h4>
    <input className="channel-input"
      onChange={ ev => state.view('channel').set(ev.target.value)} />

    <h4 className="modal-h4">Select server:</h4>
    <dl className="serverlist">
      <dt className="serverlist-term">Connected servers:</dt>
      {K(serverList.view('connected'), R.map(({name, serverUrl}) =>
        <ServerEntry name={name}
                     state={state}
                     key={dashedKey([name, serverUrl])}
                     serverUrl={serverUrl}
                     clickHandler={() => state.view('server').set(name)} />))}

      <dt className="serverlist-term">Available servers:</dt>
      {K(serverList, srv => availableServers(state, srv))}
    </dl>

    <button id="cancel-join-channel-btn"
            className="modal-button modal-button-cancel"
            onClick={closeDialogue(state, join)}>
      Cancel
    </button>

    {K(state, ({channel, server}) =>
      <button id="join-channel-btn"
              className="modal-button modal-button-action"
              disabled={R.isEmpty(channel) || R.isEmpty(server)}
              onClick={joinChannel(state, join)}>
        Join channel
      </button>)}
  </div>
}


module.exports = JoinDialogue
