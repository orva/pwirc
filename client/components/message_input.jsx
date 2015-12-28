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

    const to = encodeURIComponent(this.state.channel)
    const server = encodeURIComponent(this.state.server)
    const uri = '/messages/' + server + '/' + to
    const req = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ msg: msg })
    }

    fetch(uri, req)
      .then(function() {
        form.value = ''
        console.info('say server: %s - to: %s - message: %s',
          decodeURIComponent(server),
          decodeURIComponent(to),
          msg)
      })
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
