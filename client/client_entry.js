import io from 'socket.io-client'
import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/app.jsx'

const sock = io.connect()
const app = React.createElement(App, {sock: sock})
ReactDOM.render(app, document.getElementById('app'))
