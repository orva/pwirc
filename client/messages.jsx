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
    const sock = this.props.sock
    const switcher = chan => {
      return () => sock.emit('switch', chan)
    }
    const toChan1 = switcher('#nirc-testing-1')
    const toChan2 = switcher('#nirc-testing-2')
    const messages = R.map(this.createLineDOM, this.state.lines)

    return (
      <div>
        <button onClick={toChan1}>chan1</button>
        <button onClick={toChan2}>chan2</button>
        <ul id="messages">{messages}</ul>
      </div>
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
