import EventEmitter from 'events'

export function server() {
  return {
    serverUrl: 'chat.freenode.net',
    name: 'freenode',
    events: new EventEmitter(),
    allMessages: [
      {time: new Date(), key: '1', name: 'freenode', server: 'chat.freenode.net', user: 'user-1', to: '#first', msg: 'msg1'},
      {time: new Date(), key: '2', name: 'freenode', server: 'chat.freenode.net', user: 'user-2', to: '#first', msg: 'msg2'},
      {time: new Date(), key: '3', name: 'freenode', server: 'chat.freenode.net', user: 'user-1', to: '#first', msg: 'msg3'},
      {time: new Date(), key: '4', name: 'freenode', server: 'chat.freenode.net', user: 'user-1', to: '#second', msg: 'msg4'},
      {time: new Date(), key: '5', name: 'freenode', server: 'chat.freenode.net', user: 'user-3', to: '#first', msg: 'msg5'}
    ]
  }
}
