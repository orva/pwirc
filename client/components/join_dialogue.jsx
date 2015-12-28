import React from 'react'
import Popup from 'react-popup'

export default React.createClass({
  render: function() {
    return (
      <div id="join-dialogue">
        <input type="text" id="join-dialogue-server"></input>
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
      serverInput.value = ''
      channelInput.value = ''
      Popup.close()
    })
  }
