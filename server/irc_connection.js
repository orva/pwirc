import irc from 'irc'
import uuid from 'uuid'

const messages = []
const server = 'chat.freenode.net'
const channels = ['#nirc-testing-1', '#nirc-testing-2']
const client = setupClient()

export function getClient() {
  return client
}

export function getMessages() {
  return messages
}

export function createMessageObject(server, from, to, msg) {
  return {
    time: new Date(),
    key: uuid.v4(),
    server: server,
    nick: from,
    to: to,
    msg: msg
  }
}

function setupClient() {
  const client = new irc.Client(server, 'nirc-test-user', {
    channels: channels
  })

  client.addListener('error', err => {
    console.log('error', err)
  })

  client.addListener('message', (from, to, msg) => {
    const message = createMessageObject(server, from, to, msg)
    messages.push(message)
    console.log('message', message)
  })

  return client
}
