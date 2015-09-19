import React from 'react'
import R from 'ramda'

import './messages.css'

export default class Messages extends React.Component {
  constructor(props) {
    super(props)
    this.state = { lines: [] }
  }

  componentDidMount = () => {
    this.props.sock.on('channel-switched', data => {
      this.setState({ lines: data.lines })
    })

    this.props.sock.on('message', msg => {
      const lines = R.append(msg, this.state.lines)
      const newState = R.assoc('lines', lines, this.state)
      this.setState(newState)
    })
  }

  render = () => {
    const messages = R.map(this.createLineDOM, this.state.lines)

    return (
      <ul id="messages">{messages}</ul>
    )
  }

  createLineDOM = (line) => {
    return (
      <li key={line.key} className="line">
        <span className="time">{this.formatTimestamp(line.time)}</span>
        <span className="nick">{line.user}:</span>
        <span className="msg">{line.msg}</span>
      </li>
    )
  }

  formatTimestamp = (datestr) => {
    const date = new Date(datestr)
    const hours = date.getHours()
    const mins = date.getMinutes()
    const hourStr = (hours < 10) ? '0' + hours : hours
    const minStr = (mins < 10) ? '0' + mins : mins

    return hourStr + ':' + minStr
  }
}
