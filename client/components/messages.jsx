import React from 'react'
import R from 'ramda'

import MessageInput from './message_input.jsx'
import './messages.css'

export default React.createClass({
  render: function() {
    const messages = R.map(Line, this.props.messages)

    return (
      <div id='messages-wrapper'>
        <ul id='messages'>{messages}</ul>
        <MessageInput currentChannel={this.props.currentChannel}></MessageInput>
      </div>
    )
  }
})

const Line = props => {
  return (
    <li key={props.key} className='line'>
      <span className='time'>{formatTimestamp(props.time)}</span>
      <span className='nick'>{props.user}:</span>
      <span className='msg'>{props.msg}</span>
    </li>
  )
}

function formatTimestamp(datestr) {
  const date = new Date(datestr)
  const hours = date.getHours()
  const mins = date.getMinutes()
  const hourStr = (hours < 10) ? '0' + hours : hours
  const minStr = (mins < 10) ? '0' + mins : mins

  return hourStr + ':' + minStr
}
