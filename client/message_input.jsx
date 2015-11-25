import React from 'react'

export default class MessageInput extends React.Component {
  constructor(props) {
    super(props)
  }

  render = () => {
    return (
      <div id='message-input-box'>
        <input id='message-input' type='text'
          onKeyDown={this.handleKeyDown}
          onSubmit={this.handleSubmit} />
      </div>
    )
}

  handleSubmit = () => {
    const form = document.getElementById('message-input')
    const msg = form.value
    form.value = ''
    console.log('input:', msg)
  }

  handleKeyDown = (ev) => {
    if (ev.key === 'Enter')
      this.handleSubmit()
  }
}
