const EventEmitter = require('events')

const R = require('ramda')
const should = require('should')
const proxyquire = require('proxyquire')
const stubs = require('./stubs')

describe('IrcServerState', function() {
  beforeEach(function() {
    const ircStub = {}
    ircStub.channels = server => {
      if (server.name === 'freenode') {
        return ['#freenode-1', '#freenode-2']
      }
      if (server.name === 'quakenet') {
        return ['#quakenet-1', '#quakenet-2', '#quakenet-3']
      }
    }

    this.servers = proxyquire('../server/irc_server_state', {
      './irc_server': ircStub
    })
  })

  describe('create', function() {
    it('returns object with field servers', function() {
      const serverState = this.servers.create()
      should.exist(serverState.servers)
      should(serverState.servers instanceof Array).be.true()
      should.equal(serverState.servers.length, 0)
    })

    it('returns object with field events', function() {
      const serverState = this.servers.create()
      should.exist(serverState.events)
      should(serverState.events instanceof EventEmitter).be.true()
    })
  })

  describe('add', function() {
    it('adds provided server into state.servers', function() {
      const serverState = this.servers.create()
      const srv = stubs.server()
      this.servers.add(serverState, srv)
      should(R.contains(srv, serverState.servers)).be.true()
    })

    it('emits "server-added"', function(done) {
      const serverState = this.servers.create()
      const srv = stubs.server()

      serverState.events.on('server-added', s => {
        should.equal(s, srv)
        done()
      })
      this.servers.add(serverState, srv)
    })
  })

  describe('remove', function() {
    it('removes provided server from state.servers', function() {
      const serverState = this.servers.create()
      const srv = stubs.server()
      this.servers.add(serverState, srv)
      this.servers.remove(serverState, srv)
      should(R.contains(srv, serverState.servers)).be.false()
    })

    it('emits "server-removed"', function(done) {
      const serverState = this.servers.create()
      const srv = stubs.server()

      serverState.events.on('server-removed', s => {
        should.equal(s, srv)
        done()
      })
      this.servers.add(serverState, srv)
      this.servers.remove(serverState, srv)
    })
  })

  describe('allChannels', function() {
    it('lists all channels from every server', function() {
      const serverState = this.servers.create()
      const freenode = stubs.server()
      const quakenet = stubs.server()
      quakenet.name = 'quakenet'

      this.servers.add(serverState, freenode)
      this.servers.add(serverState, quakenet)
      const expected = [
        { server: 'freenode', channel: '#freenode-1'},
        { server: 'freenode', channel: '#freenode-2'},
        { server: 'quakenet', channel: '#quakenet-1'},
        { server: 'quakenet', channel: '#quakenet-2'},
        { server: 'quakenet', channel: '#quakenet-3'}
      ]
      const actual = this.servers.allChannels(serverState)

      should.deepEqual(actual, expected)
    })

    it('returns empty array when no servers present', function() {
      const serverState = this.servers.create()
      should.deepEqual(this.servers.allChannels(serverState), [])
    })
  })

  describe('isExistingChannel', function() {
    it('returns true when server-channel combination exists', function() {
      const serverState = this.servers.create()
      this.servers.add(serverState, stubs.server())

      const exists = this.servers.isExistingChannel(serverState, 'freenode', '#freenode-1')
      should(exists).be.true()
    })

    it('returns falsy when there is no servers at all', function() {
      const serverState = this.servers.create()
      const exists = this.servers.isExistingChannel(serverState, 'freenode', '#freenode-1')
      should(exists).not.be.ok()
    })

    it('returns falsy when asked server does not exist', function() {
      const serverState = this.servers.create()
      this.servers.add(serverState, stubs.server())

      const exists = this.servers.isExistingChannel(serverState, 'imaginary', '#freenode-1')
      should(exists).not.be.ok()
    })

    it('returns falsy when asked server exists but channel does not', function() {
      const serverState = this.servers.create()
      this.servers.add(serverState, stubs.server())

      const exists = this.servers.isExistingChannel(serverState, 'freenode', '#imaginary')
      should(exists).not.be.ok()
    })
  })

  describe('find', function() {
    it('returns server object matching the given name', function() {
      const serverState = this.servers.create()
      this.servers.add(serverState, stubs.server())
      should(this.servers.find(serverState, 'freenode')).be.ok()
    })

    it('returns falsy when no match is found', function() {
      const serverState = this.servers.create()
      this.servers.add(serverState, stubs.server())
      should(this.servers.find(serverState, 'imaginary')).not.be.ok()
    })
    it('returns falsy when there are no servers at all', function() {
      const serverState = this.servers.create()
      should(this.servers.find(serverState, 'freenode')).not.be.ok()
    })
  })
})
