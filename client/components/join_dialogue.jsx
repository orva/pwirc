import R from 'ramda'
import React from 'react'
import Popup from 'react-popup'

export default React.createClass({
  render: function() {
    console.log(this.props)
    return (
      <div id="join-dialogue">
        <ServerSelect
          connectedServers={this.props.connectedServers}
          availableServers={this.props.availableServers} />
        <input type="text" id="join-dialogue-channel"></input>
        <button type="button" onClick={handleJoinClick}>join</button>
      </div>
    )
  }
})

function handleJoinClick() {
  const serverInput = document.getElementById('join-dialogue-server')
  const channelInput = document.getElementById('join-dialogue-channel')
  const server = encodeURIComponent(serverInput.value)
  const channel = encodeURIComponent(channelInput.value)
  const uri = '/channels/' + server + '/' + channel

  fetch(uri, { method: 'post' })
    .then(() => {
      channelInput.value = ''
      Popup.close()
    })
}

function ServerSelect(props) {
  const connectedNames = R.map(R.prop('name'), props.connectedServers)
  const connected = R.map(ConnectedServer, connectedNames)

  const notConnected = R.reject(R.flip(R.contains)(connectedNames),
    R.keys(props.availableServers))
  const available = R.map(AvailableServer, notConnected)

  return (
    <select id="join-dialogue-server">
      <optgroup label="connected servers">
        {connected}
      </optgroup>
      <optgroup label="available servers">
        {available}
      </optgroup>
    </select>
  )
}

function ConnectedServer(name) {
  return <option key={'connected-' + name}>{name}</option>
}

function AvailableServer(name) {
  return <option disabled={true} key={'available-' + name}>{name}</option>
}
