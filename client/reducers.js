import { combineReducers } from 'redux'
import * as actions from './actions'

export default combineReducers({
  messages,
  channels,
  currentChannel
})

function messages(state = [], action) {
  switch (action.type) {
    case actions.RECEIVE_MESSAGE:
      return state.concat(action.payload)
    case actions.SWITCH_CHANNEL:
      return action.payload.lines
    default:
      return state
  }
}

function channels(state = [], action) {
  switch (action.type) {
    case actions.UPDATE_CHANNELS:
      return action.payload
    default:
      return state
  }
}

function currentChannel(state = {}, action) {
  switch (action.type) {
    case actions.SWITCH_CHANNEL:
      return {
        channel: action.payload.channel,
        server: action.payload.server
      }
    default:
      return state
  }
}