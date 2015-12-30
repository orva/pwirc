import React from 'react'
import { connect } from 'react-redux'
import Popup from 'react-popup'

import Messages from './messages.jsx'
import Channels from './channels.jsx'

import './app.css'

const App = React.createClass({
  render: function() {
    const { messages, channels, currentChannel } = this.props

    const content = React.createElement(Messages, {
      messages: messages,
      currentChannel: currentChannel
    })

    const sidepanel = React.createElement(Channels, {
      switchChannel: channelSwitcher(this.props.sock),
      channels: channels,
      openPopup: openPopup
    })

    return (
      <div id="sidepanel-view">
        <div id="sidepanel">{sidepanel}</div>
        <div id="content">{content}</div>
        <Popup closeBtn={false}/>
      </div>
    )
  }
})

function openPopup(title, content) {
  Popup.create({
    title: title,
    content: content
  })
}

function channelSwitcher(sock) {
  return  (chan) => {
    sock.emit('switch', chan)
  }
}


export default connect(state => state)(App)
