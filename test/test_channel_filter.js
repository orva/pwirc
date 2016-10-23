const EventEmitter = require('events')
const R = require('ramda')

const should = require('should')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const stubs = require('./stubs')

const serverState = require('../server/irc_server_state')

const channelPath = '../server/channel_filter'


describe('ChannelFilter', () => {
  beforeEach(function() {
    const ircStub = {}
    ircStub.channels = sinon.stub().returns(['#first', '#second'])

    const stateStub = {
      servers: [stubs.server()],
      events: new EventEmitter()
    }

    this.stateStub = stateStub
    this.ircStub = ircStub

    this.channel = proxyquire(channelPath, { './irc_server': this.ircStub })
  })

  describe('create', function() {
    it('stores first server from given state', function() {
      const c = this.channel.create(this.stateStub)
      should.equal(c.server, R.head(this.stateStub.servers))
    })

    it('sets first channel from first server from state as current channel', function() {
      const c = this.channel.create(this.stateStub)

      should.ok(this.ircStub.channels.called)
      should.equal(c.channel, '#first')
    })

    it('sets channel and server undefined if there is no connected servers', function() {
      this.stateStub.servers = []
      const c = this.channel.create(this.stateStub)

      should.ok(this.ircStub.channels.called)
      should(c.channel).not.exist
      should(c.server).not.exist
    })

    it('stores event listeners added to server.events', function() {
      const c = this.channel.create(this.stateStub)
      const server = c.server

      R.isEmpty(c.listeners).should.be.false
      R.forEach(listener => {
        listener.should.have.property('type')
        listener.should.have.property('callback')

        server.events.listenerCount(listener.type).should.equal(1)
      }, c.listeners)
    })

    it('stores event listeners attached to server state handler', function() {
      const c = this.channel.create(this.stateStub)
      const state = c.state

      R.isEmpty(c.stateListeners).should.be.false
      R.forEach(listener => {
        listener.should.have.property('type')
        listener.should.have.property('callback')

        state.events.listenerCount(listener.type).should.equal(1)
      }, c.stateListeners)
    })
  })

  describe('close', function() {
    it('removes event listeners added to server state handler', function() {
      const c = this.channel.create(this.stateStub)
      const state = c.state
      const listeners = c.stateListeners
      this.channel.close(c)

      R.forEach(listener => {
        state.events.listenerCount(listener.type).should.equal(0)
      }, listeners)
    })

    it('removes event listeners added to server.events', function() {
      const c = this.channel.create(this.stateStub)
      const server = c.server
      const listeners = c.listeners
      this.channel.close(c)

      R.forEach(listener => {
        server.events.listenerCount(listener.type).should.equal(0)
      }, listeners)
    })

    it('removes stored server', function() {
      const c = this.channel.create(this.stateStub)
      this.channel.close(c)
      should.not.exist(c.server)
    })

    it('removes current channel', function() {
      const c = this.channel.create(this.stateStub)
      this.channel.close(c)
      should.not.exist(c.channel)
    })
  })

  describe('switchChannel', function() {
    it('changes current channel', function() {
      const c = this.channel.create(this.stateStub)
      should.ok(this.channel.switchChannel(c, '#second'))
      should.equal(c.channel, '#second')
    })

    it('fails if server does not have provided channel', function() {
      const c = this.channel.create(this.stateStub)
      should.not.exist(this.channel.switchChannel(c, '#does_not_exist'))
    })

    it('returns expected initial state for new channel', function() {
      const c = this.channel.create(this.stateStub)
      const ret = this.channel.switchChannel(c, '#second')
      const expected = {
        server: 'freenode',
        channel: '#second',
        lines: R.filter(R.propEq('to', '#second'), c.server.allMessages)
      }
      should.deepEqual(ret, expected)
    })
  })

  describe('initialState', function() {
    it('returns expected initial state', function() {
      const c = this.channel.create(this.stateStub)
      const ret = this.channel.initialState(c)
      const expected = {
        server: 'freenode',
        channel: '#first',
        lines: R.filter(R.propEq('to', '#first'), c.server.allMessages)
      }
      should.deepEqual(ret, expected)
    })
  })

  describe('events', function() {
    it('does not emit "message" if server emits message not current channel', function(done) {
      const c = this.channel.create(this.stateStub)
      const server = c.server
      this.channel.switchChannel(c, '#first')

      const msg = {time: new Date(), key: '666', server: 'chat.freenode.net', user: 'user-666', to: '#second', msg: 'woot woot'}
      c.events.on('message', function() {
        should.fail()
        done()
      })

      server.events.emit('message', msg)
      setTimeout(done, 10)
    })

    it('emits "message" if server emits message to current channel', function(done) {
      const c = this.channel.create(this.stateStub)
      const server = c.server
      this.channel.switchChannel(c, '#first')

      const expected = {time: new Date(), key: '666', server: 'chat.freenode.net', user: 'user-666', to: '#first', msg: 'woot woot'}
      c.events.on('message', function(msg) {
        should.deepEqual(msg, expected)
        done()
      })
      server.events.emit('message', expected)
    })
  })

  describe('state.events', function() {
    describe('server-added', function() {
      it('sets new server as current if current server is not set', function(done) {
        this.stateStub.servers = []
        const c = this.channel.create(this.stateStub)
        const srv = stubs.server()
        serverState.add(this.stateStub, srv)

        setTimeout(() => {
          should.equal(c.server, srv)
          should.equal(c.channel, '#first')
          done()
        }, 10)
      })

      it('does nothing when current server and channel is set', function(done) {
        const c = this.channel.create(this.stateStub)
        const expectedServer = c.server
        const srv = stubs.server()
        srv.name = 'quakenet'
        serverState.add(this.stateStub, srv)

        setTimeout(() => {
          should.equal(c.server, expectedServer)
          should.equal(c.channel, '#first')
          done()
        }, 10)
      })
    })
  })

})
