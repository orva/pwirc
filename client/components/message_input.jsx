import React from 'react'

export default React.createClass({
  handleSubmit: function() {
    const form = document.getElementById('message-input')
    const msg = form.value
    const to = encodeURIComponent(this.props.currentChannel.channel)
    const server = encodeURIComponent(this.props.currentChannel.server)

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
