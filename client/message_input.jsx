import React from 'react'

export default class MessageInput extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount = () => {
    this.props.sock.on('channel-switched', data => {
      this.setState({
        server: data.server,
        channel: data.channel
      })
    })
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
    this.props.sock.emit('send-message', this.state.server, this.state.channel, msg)
    console.info('sent message:', this.state.server, this.state.channel, msg)
  }

  handleKeyDown = (ev) => {
    if (ev.key === 'Enter')
      this.handleSubmit()
  }
}
