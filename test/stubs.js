const EventEmitter = require('events')
const R = require('ramda')

export function server() {
  return {
    serverUrl: 'chat.freenode.net',
    name: 'freenode',
    nick: 'test-user',
    realName: 'Testuser Name',
    events: new EventEmitter(),
    allMessages: messages(),
    irc: {
      supported: {
        channel: {
          types: '&#'
        }
      }
    }
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

export function config() {
  return  {
    user: {
      username: 'testuser',
      // scrypted 'testpassword'
      password: '736372797074000e0000000800000001d487ca5342ddcc0fb99a793db26806ca78b8cc6f4c8b2f28601bd4e9bc66e3e139338aafc968fe2c16ac6e6ca35e7ff1eb82d1deef4d852a4bda1788cd60210264289d3224f6cd7b36e0d15a983ce1ab',
    },
    connected: [
      {
        serverName: 'freenode',
        connectedUrl: 'chat.freenode.net',
        nick: 'test-user',
        realName: 'John Doe',
        channels: ['#test1', '#test2']
      }
    ],
    servers: {
      freenode: ['chat.freenode.net'],
      mozilla: ['irc.mozilla.org'],
      quakenet: ['irc.quakenet.org'],
      rizon: ['irc.rizon.net'],
      ircnet: [
        'irc.cs.hut.fi',
        'irc.lut.fi',
        'irc.elisa.fi',
        'irc.nebula.fi',
        'irc.snt.utwente.nl',
        'hub.snt.utwente.nl'
      ]
    }
  }
}

module.exports = {
  server,
  channelsList,
  messages,
  initialState,
  config
}
