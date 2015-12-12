import React from 'react'
import Popup from 'react-popup'

export default React.createClass({
  render: function() {
    return (
      <div id="join-dialogue">
        <input type="text" id="join-dialogue-server"></input>
        <input type="text" id="join-dialogue-channel"></input>
        <button type="button" onClick={this.handleJoinClick}>join</button>
      </div>
    )
  },

  handleJoinClick: function() {
    const serverInput = document.getElementById('join-dialogue-server')
    const channelInput = document.getElementById('join-dialogue-channel')
    const server = serverInput.value
    const channel = channelInput.value

    serverInput.value = ''
    channelInput.value = ''
    this.props.sock.emit('join', server, channel)
    Popup.close()
  }
})
