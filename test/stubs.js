import EventEmitter from 'events'
import * as R from 'ramda'

export function server() {
  return {
    serverUrl: 'chat.freenode.net',
    name: 'freenode',
    events: new EventEmitter(),
    allMessages: messages()
  }
}

export function channelsList() {
  return [
    { server: 'freenode', channel: '#first'},
    { server: 'freenode', channel: '#second'},
    { server: 'ircnet', channel: '#third'}
  ]
}

export function messages() {
  return [
    {time: new Date(), key: '1', server: 'chat.freenode.net', user: 'user-1', to: '#first', msg: 'msg1'},
    {time: new Date(), key: '2', server: 'chat.freenode.net', user: 'user-2', to: '#first', msg: 'msg2'},
    {time: new Date(), key: '3', server: 'chat.freenode.net', user: 'user-1', to: '#first', msg: 'msg3'},
    {time: new Date(), key: '4', server: 'chat.freenode.net', user: 'user-1', to: '#second', msg: 'msg4'},
    {time: new Date(), key: '5', server: 'chat.freenode.net', user: 'user-3', to: '#first', msg: 'msg5'}
  ]
}

export function initialState() {
  return {
    server: 'freenode',
    channel: '#first',
    lines: messages(R.filter(R.propEq('to', '#first'), messages()))
  }
}
