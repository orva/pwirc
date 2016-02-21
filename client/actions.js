export const RECEIVE_MESSAGE = 'RECEIVE_MESSAGE'
export const UPDATE_CHANNELS = 'UPDATE_CHANNELS'
export const SWITCH_CHANNEL = 'SWITCH_CHANNEL'
export const UPDATE_SERVERS = 'UPDATE_SERVERS'

export function receiveMessage(msg) {
  return { type: RECEIVE_MESSAGE, payload: msg }
}

export function updateChannels(channelInfo) {
  return { type: UPDATE_CHANNELS, payload: channelInfo }
}

export function switchChannel(initialState) {
  return { type: SWITCH_CHANNEL, payload: initialState }
}

export function updateServers(serverInfo) {
  return { type: UPDATE_SERVERS, payload: serverInfo}
}
