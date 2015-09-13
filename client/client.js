import React from 'react'
import Messages from './messages.jsx'
import io from 'socket.io-client'

const sock = io.connect()

const msgArea = document.getElementById('message-area')
const messages = React.createElement(Messages, { sock: sock })
React.render(messages, msgArea)
