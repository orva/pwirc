import React from 'react'
import R from 'ramda'

import MessageInput from './message_input.jsx'
import './messages.css'

export default React.createClass({
  getInitialState: function() {
    return { lines: [] }
  },

  componentDidMount: function() {
    this.props.sock.on('channel-switched', data => {
      this.setState({ lines: data.lines })
    })

    this.props.sock.on('message', msg => {
      const lines = R.append(msg, this.state.lines)
      const newState = R.assoc('lines', lines, this.state)
      this.setState(newState)
    })
  },

  render: function() {
    const messages = R.map(line =>
      <Line key={line.key} time={line.time} nick={line.user} msg={line.msg}/>,
      this.state.lines)

    return (
      <div id='messages-wrapper'>
        <ul id='messages'>{messages}</ul>
        <MessageInput sock={this.props.sock}></MessageInput>
      </div>
    )
  }
})

const Line = React.createClass({
  shouldComponentUpdate: function() {
    return false
  },

  render: function() {
    return (
      <li key={this.props.key} className='line'>
        <span className='time'>{formatTimestamp(this.props.time)}</span>
        <span className='nick'>{this.props.nick}:</span>
        <span className='msg'>{this.props.msg}</span>
      </li>
    )
  }
})


function formatTimestamp(datestr) {
  const date = new Date(datestr)
  const hours = date.getHours()
  const mins = date.getMinutes()
  const hourStr = (hours < 10) ? '0' + hours : hours
  const minStr = (mins < 10) ? '0' + mins : mins

  return hourStr + ':' + minStr
}
