import io from 'socket.io-client'
import React from 'react'

import App from './app.jsx'

const sock = io.connect()
const app = React.createElement(App, {sock: sock})
React.render(app, document.getElementById('app'))
