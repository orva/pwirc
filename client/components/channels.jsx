import React from 'react'
import R from 'ramda'

import JoinDialogue from './join_dialogue.jsx'

import './channels.css'

export default React.createClass({
  render: function() {
    const chans = R.map(this.createChannelDOM, this.props.channels)

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
    const join = <JoinDialogue />
    this.props.openPopup('Join channel', join)
  },

  createChannelDOM: function(ch) {
    const key = ch.channel + '@' + ch.server
    const uri = '/channels/' +
      encodeURIComponent(ch.server) + '/' + encodeURIComponent(ch.channel)

    return (
      <li key={key} className="channel">
        <a href={uri} >{ch.channel}</a>
      </li>
    )
  },

  handleChannelClick: function(ev) {
    const ch = ev.target.dataset.channel
    this.props.switchChannel(ch)
  }
})
