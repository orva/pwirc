import React from 'react'
import Messages from './messages.jsx'
import Channels from './channels.jsx'
import io from 'socket.io-client'

const sock = io.connect()

const chanArea = document.getElementById('channel-area')
const channels = React.createElement(Channels, { sock: sock })
React.render(channels, chanArea)

const msgArea = document.getElementById('message-area')
const messages = React.createElement(Messages, { sock: sock })
React.render(messages, msgArea)
