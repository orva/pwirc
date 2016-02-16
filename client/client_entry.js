// jsx transformations require react to exist with name "React"
import React from 'react' // eslint-disable-line no-unused-vars

import page from 'page'
import io from 'socket.io-client'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { render } from 'react-dom'

import App from './components/app.jsx'
import reducers from './reducers'
import * as actions from './actions'

const store = createStore(reducers)
const sock = io.connect()


page() // Register page.js pushstate handlers, etc
page('/channels/:server/:channel', ctx => {
  sock.emit('switch', ctx.params.channel)
})


sock.on('channel-switched', chan => {
  store.dispatch(actions.switchChannel(chan))
})

sock.on('channels-updated', channels => {
  store.dispatch(actions.updateChannels(channels))
})

sock.on('message', msg => {
  store.dispatch(actions.receiveMessage(msg))
})

sock.on('welcome', () => {
  const chan = store.getState().channels[0]
  if (!chan) {
    return
  }

  const uri = '/channels/' + encodeURIComponent(chan.server) + '/' +
    encodeURIComponent(chan.channel)
  page(uri)
})


render(
  <Provider store={store}>
    <App sock={sock}/>
  </Provider>,
  document.getElementById('app')
)
