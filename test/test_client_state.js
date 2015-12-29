import * as R from 'ramda'
import should from 'should'
import * as stubs from './stubs'

import reducer from '../client/reducers.js'
import * as actions from '../client/actions.js'

describe('reducers', function() {
  it('has expected initial state', function() {
    const state = reducer(undefined, {})
    should.deepEqual(state, { channels: [], messages: [], currentChannel: {} })
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
})
