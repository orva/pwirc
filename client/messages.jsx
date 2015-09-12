import React from 'react'
import R from 'ramda'
import Chance from 'chance'

import css from './messages.css'

export default class Messages extends React.Component {
  constructor(props) {
    super(props)

    this.createMockedMessages = this.createMockedMessages.bind(this)
    this.formatTimestamp = this.formatTimestamp.bind(this)
    this.render = this.render.bind(this)
    this.state = { lines: this.createMockedMessages() }
  }

  createMockedMessages() {
    const chance = Chance()
    const lines = R.times(index => {
      return {
        msg: chance.sentence(),
        user: chance.first(),
        time: chance.date({year: 2015}),
        key: index
      }
    }, 200)

    return lines
  }

  formatTimestamp(date) {
    const hours = date.getHours()
    const mins = date.getMinutes()
    const hourStr = (hours < 10) ? '0' + hours : hours
    const minStr = (mins < 10) ? '0' + mins : mins

    return hourStr + ':' + minStr
  }

  render() {
    const messages = R.map(line => {
      return (
        <li key={line.key} className="line">
          <span className="time">{this.formatTimestamp(line.time)}</span>
          <span className="nick">{line.user}:</span>
          <span className="msg">{line.msg}</span>
        </li>
      )
    }, this.state.lines)

    return <ul id="messages">{messages}</ul>
  }
}
