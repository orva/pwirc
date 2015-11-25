import io from 'socket.io-client'
import React from 'react'

import Messages from './messages.jsx'
import Channels from './channels.jsx'
import JoinDialogue from './join_dialogue.jsx'
import App from './app.jsx'

const sock = io.connect()
const appProps = {
  sidepanel: React.createElement(Channels, { sock: sock }),
  content: React.createElement(Messages, { sock: sock }),
  join: React.createElement(JoinDialogue, { sock: sock })
}

const app = React.createElement(App, appProps)
React.render(app, document.getElementById('app'))
