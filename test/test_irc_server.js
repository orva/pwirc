const EventEmitter = require('events')
const R = require('ramda')
const Promise = require('bluebird')
const sinon = require('sinon')
const should = require('should')
const proxyquire = require('proxyquire')

const ircPath = '../server/irc_server'

describe('IrcServer', function() {
  beforeEach(function() {
    this.client = new EventEmitter()
    this.client.nick = 'test-user'
    this.client.join = sinon.spy()
    this.client.say = sinon.spy()
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

  describe('nick', function() {
    it('is set to the value from `irc.connect` parameters', function() {
      should.equal(this.server.nick, 'test-user')
    })

    it('is updated when `server.irc` emits `nick` targeting user', function() {
      const srv = this.server
      this.client.emit('nick', 'test-user', 'second-test-user', ['#testing-1', '#testing-2'])

      return Promise.delay(20)
        .then(() => should.equal(srv.nick, 'second-test-user'))
    })

    it('is NOT updated when `server.irc` emits `nick` targeting other users', function() {
      const srv = this.server
      this.client.emit('nick', 'other-user', 'second-test-user', ['#testing-1', '#testing-2'])

      return Promise.delay(20)
        .then(() => should.equal(srv.nick, 'test-user'))
    })
  })

  describe('names', function() {
    it('is updated when `server.irc` emits `names`', function() {
      const lovelyChannel = '#lovely-channel'
      const lovelyUsers = {
        'pooh': '@',
        'moomin': '+',
      }
      const nastyChannel = '#nasty-channel'
      const nastyUsers = {
        'doctorevil': '@',
        'minime': '',
      }

      const expected = {
        [lovelyChannel]: lovelyUsers,
        [nastyChannel]: nastyUsers,
      }

      this.client.emit('names', lovelyChannel, lovelyUsers)
      this.client.emit('names', nastyChannel, nastyUsers)

      const server = this.server
      return Promise.delay(25)
        .then(() => should.deepEqual(server.names, expected))
    })
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

  describe('disconnect', function() {
    it('removes event listeners from irc connection')
    it('removes events field from the object')
    it('removes irc field from the object')
  })

  describe('say', function() {
    it('calls irc.say with provided target and message', function() {
      this.irc.say('#testing-1', 'hello world!', this.server)
      const callParams = this.client.say.args[0]
      should.deepEqual(callParams, ['#testing-1', 'hello world!'])
    })

    it('succeeds when target is not channel', function() {
      this.irc.say('other-user', 'hello world!', this.server)
      const callParams = this.client.say.args[0]
      should.deepEqual(callParams, ['other-user', 'hello world!'])
    })

    it('fails if target channel is not already joined', function() {
      this.irc.say('#unkown-channel', 'hello world!', this.server)
      should(this.client.join.called).be.false()
    })
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
    it('returns channel names from irc.chans', function() {
      should.deepEqual(this.irc.channels(this.server),
        ['#testing-1', '#testing-2'])
      this.client.chans['#banana'] = {}
      should.deepEqual(this.irc.channels(this.server),
        ['#testing-1', '#testing-2', '#banana'])
    })

    it('returns empty array if there is no channels', function() {
      this.client.chans = {}
      should.deepEqual(this.irc.channels(this.server), [])
    })

    it('returns empty array if server is undefined', function() {
      should.deepEqual(this.irc.channels(undefined), [])
    })
  })

  describe('events', function() {
    function shouldBeMessageObject(obj) {
      should.exist(obj.time, 'msg.time')
      should.exist(obj.key, 'msg.key')
      should.exist(obj.server, 'msg.server')
      should.exist(obj.user, 'msg.user')
      should.exist(obj.selfMessage, 'msg.selfMessage')
      should.exist(obj.to, 'msg.to')
      should.exist(obj.msg, 'msg.msg')
    }


    describe('message', function() {
      it('is emitted when channel receives messages from other users', function(done) {
        this.server.events.on('message', function(msg) {
          should.exist(msg)
          shouldBeMessageObject(msg)
          should.equal(msg.user, 'other-user')
          should.equal(msg.to, '#testing-1')
          should.equal(msg.msg, 'hello world!')
          should(msg.selfMessage).be.false()
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
          should(msg.selfMessage).be.true()
          done()
        })

        this.server.irc.emit('selfMessage', '#testing-1', 'hello world!')
      })

      it('is not emitted from server.irc `message` emits from user nickname', function(done) {
        const spy = sinon.spy()
        this.server.events.on('message', spy)
        this.server.irc.emit('message', 'test-user', '#testing-3', 'other-user')

        setTimeout(() => {
          should(spy.called).be.false()
          done()
        }, 25)
      })

      it('messages from user can be found with `server.messages`', function(done) {
        const server = this.server
        const irc = this.irc
        this.server.events.on('message', function(msg) {
          const messageExists = R.contains(msg, irc.messages('#testing-1', server))
          should(messageExists).be.true()
          done()
        })

        this.server.irc.emit('selfMessage', '#testing-1', 'hello world!')
      })

      it('messages from others can be found with `server.messages`', function(done) {
        const server = this.server
        const irc = this.irc
        this.server.events.on('message', function(msg) {
          const messageExists = R.contains(msg, irc.messages('#testing-1', server))
          should(messageExists).be.true()
          done()
        })

        this.server.irc.emit('message', 'other-user', '#testing-1', 'hello world!')
      })
    })

    describe('private-message', function() {
      it('is emitted when someone messages user directly', function(done) {
        this.server.events.on('private-message', function(msg) {
          shouldBeMessageObject(msg)
          should(msg.selfMessage).be.false()
          done()
        })

        this.server.irc.emit('pm', 'someone', 'message from someone')
      })

      it('is emitted when user messages someone directly', function(done) {
        this.server.events.on('private-message', function(msg) {
          shouldBeMessageObject(msg)
          should(msg.selfMessage).be.true()
          done()
        })

        this.server.irc.emit('selfMessage', 'someone', 'our message to someone')
      })

      it('private messages to user can be found with `server.messages`', function(done) {
        const server = this.server
        const irc = this.irc
        this.server.events.on('private-message', function(msg) {
          const messageExists = R.contains(msg, irc.messages('someone', server))
          should(messageExists).be.true()
          done()
        })

        this.server.irc.emit('pm', 'someone', 'hello world!')
      })

      it('private messages from user can be found with `server.messages`', function(done) {
        const server = this.server
        const irc = this.irc
        this.server.events.on('private-message', function(msg) {
          const messageExists = R.contains(msg, irc.messages('someone', server))
          should(messageExists).be.true()
          done()
        })

        this.server.irc.emit('selfMessage', 'someone', 'our message to someone')
      })
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

    describe('names', function() {
      const lovelyChannel = '#lovely-channel'
      const lovelyUsers = {
        'pooh': '@',
        'moomin': '+',
      }
      const nastyChannel = '#nasty-channel'
      const nastyUsers = {
        'doctorevil': '@',
        'minime': '',
      }


      it('is emitted when `server.irc` emits `names`', function() {
        const spy = sinon.spy()
        this.server.events.on('names', spy)

        this.client.emit('names', lovelyChannel, lovelyUsers)
        this.client.emit('names', nastyChannel, nastyUsers)

        return Promise.delay(25)
          .then(() => {
            should(spy.calledWith({ [lovelyChannel]: lovelyUsers })).be.true()
            should(spy.calledWith({ [nastyChannel]: nastyUsers })).be.true()
          })
      })

      it('is emitted when `server.events` emits `event-join`')
      it('is emitted when `server.events` emits `event-part`')
    })

    describe('event-join', function() {
      it('is emitted when someone else joins a channel')
      it('is not emitted when user joins a channel')
      it('contains expected fields in payload')
    })

    describe('event-part', function() {
      it('is emitted when someone else parts a channel')
      it('is not emitted when user parts a channel')
      it('contains expected fields in payload')
    })

    describe('event-action', function() {
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
