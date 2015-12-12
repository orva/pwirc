import React from 'react'
import R from 'ramda'

import JoinDialogue from './join_dialogue.jsx'

import './channels.css'

export default class Channels extends React.Component {
  constructor(props) {
    super(props)
    this.state = { channels: [] }
  }

  componentDidMount = () => {
    this.props.sock.on('welcome', data => {
      const newState = R.assoc('channels', data.channels, this.state)
      this.setState(newState)
    })
  }

  openJoin = () => {
    const join = <JoinDialogue/>
    this.props.openPopup('Join channel', join)
  }

  render = () => {
    const chans = R.map(this.createChannelDOM, this.state.channels)

    return (
      <div id="channels">
        <ul id="channel-list">{chans}</ul>
        <div id="channel-menu">
          <button type="button" onClick={this.openJoin}>laalaa</button>
        </div>
      </div>
    )
  }

  createChannelDOM = (ch) => {
    const key = ch.channel + '@' + ch.server
    return (
      <li key={key} className="channel">
        <a onClick={this.handleChannelClick} data-channel={ch.channel}>
          {ch.channel}
        </a>
      </li>
    )
  }

  handleChannelClick = (ev) => {
    const ch = ev.target.dataset.channel
    this.props.sock.emit('switch', ch)
  }
}
