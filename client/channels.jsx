import React from 'react'
import R from 'ramda'

class Channels extends React.Component {
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

  render = () => {
    const chans = R.map(this.createChannelDOM, this.state.channels)
    return <ul id="channels">{chans}</ul>
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

export default Channels
