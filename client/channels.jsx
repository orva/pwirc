import React from 'react'
import R from 'ramda'

export default class Channels extends React.Component {
  constructor() {
    super()
    this.state = { channels: [] }
  }

  componentDidMount = () => {
    this.props.sock.on('welcome', data => {
      const newState = R.assoc('channels', data.channels, this.state)
      this.setState(newState)
    })
  }

  render = () => {
    const chans = R.map(this.createChannelDOM, this.state.channels)
    return <ul id="channels">{chans}</ul>
  }

  createChannelDOM = (ch) => {
    const key = ch.channel + '@' + ch.server
    return (
      <li key={key} className="channel">
        {ch.channel}
      </li>
    )
  }
}
