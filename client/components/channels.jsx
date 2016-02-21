import React from 'react'
import R from 'ramda'

import JoinDialogue from './join_dialogue.jsx'

import './channels.css'

export default React.createClass({
  render: function() {
    const chans = R.map(Channel, this.props.channels)

    return (
      <div id="channels">
        <ul id="channel-list">{chans}</ul>
        <div id="channel-menu">
          <button type="button" onClick={this.openJoin}>laalaa</button>
        </div>
      </div>
    )
  },

  openJoin: function() {
    const join = <JoinDialogue
      connectedServers={this.props.connectedServers}
      availableServers={this.props.availableServers} />
    this.props.openPopup('Join channel', join)
  },

  handleChannelClick: function(ev) {
    const ch = ev.target.dataset.channel
    this.props.switchChannel(ch)
  }
})

const Channel = props => {
  const key = props.channel + '@' + props.server
  const uri = '/channels/' +
    encodeURIComponent(props.server) + '/' + encodeURIComponent(props.channel)

  return (
    <li key={key} className="channel">
      <a href={uri} >{props.channel}</a>
    </li>
  )
}
