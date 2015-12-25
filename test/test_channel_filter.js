import R from 'ramda'

import should from 'should'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import * as stubs from './stubs'

const channelPath = '../server/channel_filter'


describe('ChannelFilter', () => {
  before(function() {
    const ircStub = {}
    ircStub.channels = sinon.stub().returns(['#first', '#second'])

    this.ircStub = ircStub
    this.channel = proxyquire(channelPath, { './irc_server': this.ircStub })
  })

  describe('create', function() {
    it('sets first channel from supplied server as current channel', function() {
      const c = this.channel.create(stubs.server())

      should.ok(this.ircStub.channels.called)
      should.equal(c.channel, '#first')
    })

    it('stores provided server', function() {
      const server = stubs.server()
      const c = this.channel.create(server)

      should.equal(c.server, server)
    })

    it('stores event listeners added to server.events', function() {
      const server = stubs.server()
      const c = this.channel.create(server)

      R.isEmpty(c.listeners).should.be.false
      R.forEach(listener => {
        listener.should.have.property('type')
        listener.should.have.property('callback')

        server.events.listenerCount(listener.type).should.equal(1)
      }, c.listeners)
    })
  })

  describe('close', function() {
    it('removes event listeners added to server.events', function() {
      const server = stubs.server()
      const c = this.channel.create(server)
      const listeners = c.listeners
      this.channel.close(c)

      R.forEach(listener => {
        server.events.listenerCount(listener.type).should.equal(0)
      }, listeners)
    })

    it('removes stored server', function() {
      const c = this.channel.create(stubs.server())
      this.channel.close(c)
      should.not.exist(c.server)
    })

    it('removes current channel', function() {
      const c = this.channel.create(stubs.server())
      this.channel.close(c)
      should.not.exist(c.channel)
    })
  })

  describe('initialState', function() {
    before(function() {
      this.server = stubs.server()
      this.session = this.channel.create(this.server)
      this.state = this.channel.initialState(this.session)
    })

    it('returns object containing current channel', function() {
      should.equal(this.state.channel, '#first')
    })

    it('returns object containing current server name', function() {
      should.equal(this.state.server, this.server.name)
    })

    it('returns object containing some messages to current channel', function() {
      const expected = R.filter(R.propEq('to', this.session.channel), this.state.lines)
      should.deepEqual(this.state.lines, expected)
    })
  })

  describe('switchChannel', function() {
    it('changes current channel', function() {
      const c = this.channel.create(stubs.server())
      should.ok(this.channel.switchChannel(c, '#second'))
      should.equal(c.channel, '#second')
    })

    it('fails if server does not have provided channel', function() {
      const c = this.channel.create(stubs.server())
      should.not.exist(this.channel.switchChannel(c, '#does_not_exist'))
    })

    it('returns ChannelFilter.initialState for new channel', function() {
      const c = this.channel.create(stubs.server())
      const ret = this.channel.switchChannel(c, '#second')
      should.deepEqual(ret, this.channel.initialState(c))
    })
  })

  describe('events', function() {
    it('does not emit "message" if server emits message not current channel', function(done) {
      const server = stubs.server()
      const c = this.channel.create(server)
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
      const server = stubs.server()
      const c = this.channel.create(server)
      this.channel.switchChannel(c, '#first')

      const expected = {time: new Date(), key: '666', server: 'chat.freenode.net', user: 'user-666', to: '#first', msg: 'woot woot'}
      c.events.on('message', function(msg) {
        should.deepEqual(msg, expected)
        done()
      })
      server.events.emit('message', expected)
    })
  })
})
