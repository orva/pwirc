import React from 'react'

export default React.createClass({
  getInitialState: function() {
    return {
      server: '',
      channel: ''
    }
  },

  handleSubmit: function() {
    const form = document.getElementById('message-input')
    const msg = form.value
    form.value = ''
    this.props.sock.emit('send-message', this.state.server, this.state.channel, msg)
    console.info('sent message:', this.state.server, this.state.channel, msg)
  },

  handleKeyDown: function(ev) {
    if (ev.key === 'Enter')
      this.handleSubmit()
  },

  componentDidMount: function() {
    this.props.sock.on('channel-switched', data => {
      this.setState({
        server: data.server,
        channel: data.channel
      })
    })
  },

  render: function() {
    return (
      <div id='message-input-box'>
        <input id='message-input' type='text'
          onKeyDown={this.handleKeyDown}
          onSubmit={this.handleSubmit} />
      </div>
    )
  }
})
