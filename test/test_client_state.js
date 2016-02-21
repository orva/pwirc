import * as R from 'ramda'
import should from 'should'
import * as stubs from './stubs'

import reducer from '../client/reducers.js'
import * as actions from '../client/actions.js'

describe('Client state reducers', function() {
  it('has expected initial state', function() {
    const state = reducer(undefined, {})
    should.deepEqual(state, {
      channels: [],
      messages: [],
      connectedServers: [],
      availableServers: [],
      currentChannel: {}
    })
  })

  it('handles UPDATE_CHANNELS action', function() {
    const expected = stubs.channelsList()
    const state = reducer({}, actions.updateChannels(expected))
    should.deepEqual(state.channels, expected)
  })

  it('handles RECEIVE_MESSAGE action', function() {
    const msg = R.head(stubs.messages())
    const state = reducer({}, actions.receiveMessage(msg))
    should.deepEqual(state.messages, [msg])
  })

  it('handles SWITCH_CHANNEL action', function() {
    const initialState = stubs.initialState()
    const state = reducer({}, actions.switchChannel(initialState))
    should.deepEqual(state.messages, initialState.lines)
    should.deepEqual(state.currentChannel, {
      server: initialState.server,
      channel: initialState.channel
    })
  })

  it('handles UPDATE_SERVERS action', function() {
    const msg = {
      connected: [
        { name: 'freenode', serverUrl: 'chat.freenode.net' },
        { name: 'quakenet', serverUrl: 'irc.quakenet.org' }
      ],
      available: {
        freenode: ['chat.freenode.net'],
        quakenet: ['irc.quakenet.org'],
        mozilla: ['irc.mozilla.org']
      }
    }

    const state = reducer({}, actions.updateServers(msg))
    should.deepEqual(state.connectedServers, msg.connected)
    should.deepEqual(state.availableServers, msg.available)
  })
})
