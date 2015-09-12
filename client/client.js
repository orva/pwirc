import React from 'react'
import Messages from './messages.jsx'

console.log('Hello World!')

const msgArea = document.getElementById('message-area')
const messages = React.createElement(Messages, null)
React.render(messages, msgArea)
