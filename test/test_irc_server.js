import EventEmitter from 'events'
import R from 'ramda'
import sinon from 'sinon'
import should from 'should'
import proxyquire from 'proxyquire'

const ircPath = '../server/irc_server'

function shouldBeMessageObject(obj) {
  should.exist(obj.time)
  should.exist(obj.key)
  should.exist(obj.server)
  should.exist(obj.user)
  should.exist(obj.to)
  should.exist(obj.msg)
}

describe('IrcServer', function() {
  beforeEach(function() {
    this.client = new EventEmitter()
    this.client.nick = 'test-user'
    this.client.join = sinon.spy()
    this.client.chans = {'#testing-1': {}, '#testing-2': {}}
    this.client.supported = {
      channel: {
        types: '&#'
      }
    }

    this.connectArgs = [
      'freenode', 'chat.freenode.net', 'test-user',
      { channels: ['#testing-1', '#testing-2'] }
    ]

    this.stubIrc = {}
    this.stubIrc.Client = sinon.stub().returns(this.client)

    this.irc = proxyquire(ircPath, { 'irc': this.stubIrc })
    this.server = this.irc.connect.apply({}, this.connectArgs)
  })

  describe('connect', function() {
    it('constructs irc.Client with provided parameters', function() {
      const expectedParams = R.tail(this.connectArgs)
      const callParams = this.stubIrc.Client.args[0]
      should.deepEqual(callParams, expectedParams)
    })

    it('offers object with field events', function() {
      should.exist(this.server.events)
      should(this.server.events instanceof EventEmitter).be.true()
    })

    it('stores provided server name', function() {
      const serverName = R.head(this.connectArgs)
      should.equal(this.server.name, serverName)
    })

    it('stores provided server url', function() {
      const serverUrl = this.connectArgs[1]
      should.equal(this.server.serverUrl, serverUrl)
    })

    it('stores listeners attached to Server.irc')
  })

  describe('join', function() {
    it('calls irc.join with provided channel', function() {
      this.irc.join(this.server, '#new-channel')
      should(this.client.join.calledWith('#new-channel')).be.ok()
    })

    it('fails if already joined the channel', function() {
      this.irc.join(this.server, '#testing-1')
      should(this.client.join.called).be.false()
    })

    it('fails if channel is not proper channel name', function() {
      this.irc.join(this.server, 'banana')
      should(this.client.join.called).be.false()
    })
  })

  describe('close', function() {
    it('removes event listeners from irc connection')
    it('removes events field from the object')
    it('removes irc field from the object')
  })

  describe('say', function() {
    it('calls irc.say with provided target and channel')
    it('succeeds when target is not channel')
    it('fails if target is non-present channel')
  })

  describe('messages', function() {
    it('returns array of all messages in provided channel')
    it('returns array of all messages in provided conversation')
    it('returns empty array for non-present target')
  })

  describe('conversations', function() {
    it('returns array of all conversations with users')
    it('returns empty array when there is no conversation history')
  })

  describe('channels', function() {
    it('returns channel names from irc.chans')
    it('returns empty array if there is no channels')
  })

  describe('events', function() {
    describe('message', function() {
      it('is emitted when channel receives messages from other users', function(done) {
        this.server.events.on('message', function(msg) {
          should.exist(msg)
          shouldBeMessageObject(msg)
          should.equal(msg.user, 'other-user')
          should.equal(msg.to, '#testing-1')
          should.equal(msg.msg, 'hello world!')
          done()
        })

        this.server.irc.emit('message', 'other-user', '#testing-1', 'hello world!')
      })

      it('is emitted when user sends message to channel', function(done) {
        this.server.events.on('message', function(msg) {
          should.exist(msg)
          shouldBeMessageObject(msg)
          should.equal(msg.user, 'test-user')
          should.equal(msg.to, '#testing-1')
          should.equal(msg.msg, 'hello world!')
          done()
        })

        this.server.irc.emit('message', 'test-user', '#testing-1', 'hello world!')
      })

      it('is payload can be found with messages-call', function(done) {
        const server = this.server
        const irc = this.irc
        this.server.events.on('message', function(msg) {
          const messageExists = R.contains(msg, irc.messages('#testing-1', server))
          should(messageExists).be.true()
          done()
        })

        this.server.irc.emit('message', 'test-user', '#testing-1', 'hello world!')
      })
    })

    describe('private-message', function() {
      it('is emitted when someone messages user directly')
      it('is emitted when user messages someone directly')
      it('contains expected fields in payload')
    })

    describe('channel-joined', function() {
      it('is emitted when user joins a channel', function(done) {
        this.server.events.on('channel-joined', function() {
          done()
        })

        this.server.irc.emit('join', '#testing-3', 'test-user')
      })

      it('is not emitted someone else joins a channel', function(done) {
        const spy = sinon.spy()
        this.server.events.on('channel-joined', spy)
        this.server.irc.emit('join', '#testing-3', 'other-user')

        setTimeout(() => {
          should(spy.called).be.false()
          done()
        }, 25)
      })

      it('contains expected fields in payload', function(done) {
        this.server.events.on('channel-joined', function(chan) {
          should.exist(chan)
          should.equal(chan, '#testing-3')
          done()
        })

        this.server.irc.emit('join', '#testing-3', 'test-user')
      })
    })

    describe('channel-left', function() {
      it('is emitted when user leaves a channel')
      it('is not emitted someone else leaves a channel')
      it('contains expected fields in payload')
    })

    describe('join', function() {
      it('is emitted when someone else joins a channel')
      it('is not emitted when user joins a channel')
      it('contains expected fields in payload')
    })

    describe('part', function() {
      it('is emitted when someone else parts a channel')
      it('is not emitted when user parts a channel')
      it('contains expected fields in payload')
    })

    describe('action', function() {
      it('is emitted when someone else does an action in channel')
      it('is emitted when user does an action in channel')
      it('contains expected fields in payload')
    })
  })

  describe('log storage', function() {
    it('stores log files under "./data"')
    it('has excepted filename')
    it('has own logfile for every channel')
  })
})
