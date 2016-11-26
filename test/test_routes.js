const Promise = require('bluebird')
const R = require('ramda')
const request = require('supertest')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const stubs = require('./stubs')
const irc = require('../server/irc_server')

describe('Routes', function() {
  before(function(done) {
    const ircStub = sinon.stub(irc)
    ircStub.connect.returns(stubs.server())
    ircStub.isChannelName.returns(true)
    ircStub.channels.returns(['#first', '#second'])
    const serversStub = {}
    serversStub.isExistingChannel = (_, srv, chan) => {
      return srv === 'freenode' && R.contains(chan, ['#first', '#second'])
    }
    serversStub.servers = [stubs.server()]

    const confStub = {}
    confStub.load = sinon.stub().returns(Promise.resolve(stubs.config()))

    const app = proxyquire('../server/http_handlers', {
      './irc_server': ircStub,
      './irc_server_state': serversStub,
      './config': confStub,
      './auth': proxyquire('../server/auth', { './config': confStub })
    })

    const user = stubs.config().user

    this.ircStub = ircStub
    this.agent = request.agent(app)
    this.agent
      .post('/login')
      .type('form')
      .send({ username: user.username })
      .send({ password: user.password })
      .end(done)
  })

  afterEach(function() {
    this.ircStub.isChannelName.returns(true)
  })


  describe('POST /messages/:server/:target', function() {
    it('responds 200 when server, target and body are supplied', function(done) {
      this.agent.post('/messages/freenode/%23first')
        .send({ msg: 'test message' })
        .expect(200, done)
    })

    it('responds 404 when both server and target are not present', function(done) {
      this.agent
        .post('/messages/freenode')
        .send({ msg: 'test message' })
        .expect(404, done)
    })

    it('responds 404 to empty body', function(done) {
      this.agent
        .post('/messages/freenode/%23first')
        .send('')
        .expect(404, done)
    })

    it('responds 404 when body does not contain "msg" field', function(done) {
      this.agent
        .post('/messages/freenode/%23first')
        .send({ fails: true })
        .expect(404, done)
    })

    it('responds 404 when server does not exist', function(done) {
      this.agent
        .post('/messages/does_not_exist/%23first')
        .send({ msg: 'test message'})
        .expect(404, done)
    })

    it('responds 404 when target is channel and does not exist', function(done) {
      this.agent
        .post('/messages/freenode/%23does_not_exist')
        .send({ msg: 'test message' })
        .expect(404, done)
    })

    it('responds 200 when target is not channel', function(done) {
      this.ircStub.isChannelName.returns(false)

      this.agent
        .post('/messages/freenode/nick')
        .send({ msg: 'test message' })
        .expect(200, done)
    })
  })

  describe('POST /channels/:server/:chan', function() {
    it('responds 200 to valid server and chan', function(done) {
      this.agent
        .post('/channels/freenode/%23third')
        .expect(200, done)
    })

    it('responds 404 to not connected server', function(done) {
      this.agent
        .post('/channels/invalid/%23third')
        .expect(404, done)
    })

    it('responds 404 to invalid channel name', function(done) {
      this.ircStub.isChannelName.returns(false)

      this.agent
        .post('/channels/freenode/not_valid_channel_name')
        .expect(404, done)
    })

    it('responds 404 to channel already present', function(done) {
      this.agent
        .post('/channels/freenode/%23first')
        .expect(404, done)
    })
  })

  describe('GET /channels/:server/:chan', function() {
    it('responds 200 to valid server and chan', function(done) {
      this.agent
        .get('/channels/freenode/%23first')
        .set('Accept', 'text/html')
        .expect(200, done)
    })

    it('responds 404 to other than "Accept - application/html"', function(done) {
      this.agent
        .get('/channels/freenode/%23first')
        .set('Accept', 'application/json')
        .expect(404, done)
    })

    it('responds 404 when both server and chan are not present', function(done) {
      this.agent
        .get('/channels/freenode/')
        .set('Accept', 'text/html')
        .expect(404, done)
    })

    it('responds 404 when server does not exist', function(done) {
      this.agent
        .get('/channels/failnode/%23first')
        .set('Accept', 'text/html')
        .expect(404, done)
    })

    it('responds 404 when channel does not exist', function(done) {
      this.agent
        .get('/channels/failnode/%23third')
        .set('Accept', 'text/html')
        .expect(404, done)
    })

    it('responds 404 to invalid channel name', function(done) {
      this.ircStub.isChannelName.returns(false)

      this.agent
        .post('/channels/freenode/not_valid_channel_name')
        .expect(404, done)
    })
  })

  describe('GET /servers', function() {
    it('responds 200 with JSON body containing connected and available servers', function(done) {
      this.agent
        .get('/servers')
        .expect({
          connected: [{
            name: 'freenode',
            serverUrl: 'chat.freenode.net',
            nick: 'test-user',
            realName: 'Testuser Name'
          }],
          available: {
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
        })
        .expect(200, done)
    })
  })

  describe('POST /servers', function() {
    it('responds with 202 when it starts connecting to server', function(done) {
      this.agent
        .post('/servers')
        .send({
          name: 'quakenet',
          serverUrl: 'irc.quakenet.org',
          personality: {
            nick: 'orvari2',
            realName: 'pwirc-test-user'
          },
          channels: ['#pwirc-quakenet-testing-1']
        })
        .expect(202, done)
    })

    it('responds with 400 when "name" is missing', function(done) {
      this.agent
        .post('/servers')
        .send({
          serverUrl: 'irc.quakenet.org',
          personality: {
            nick: 'orvari2',
            realName: 'pwirc-test-user'
          },
          channels: ['#pwirc-quakenet-testing-1']
        })
        .expect(400, done)
    })

    it('responds with 400 when "serverUrl" is missing', function(done) {
      this.agent
        .post('/servers')
        .send({
          name: 'quakenet',
          personality: {
            nick: 'orvari2',
            realName: 'pwirc-test-user'
          },
          channels: ['#pwirc-quakenet-testing-1']
        })
        .expect(400, done)
    })

    it('responds with 400 when "personality" is missing', function(done) {
      this.agent
        .post('/servers')
        .send({
          name: 'quakenet',
          serverUrl: 'irc.quakenet.org',
          channels: ['#pwirc-quakenet-testing-1']
        })
        .expect(400, done)
    })

    it('responds with 400 when "personality.nick" is missing', function(done) {
      this.agent
        .post('/servers')
        .send({
          name: 'quakenet',
          serverUrl: 'irc.quakenet.org',
          personality: {
            realName: 'pwirc-test-user'
          },
          channels: ['#pwirc-quakenet-testing-1']
        })
        .expect(400, done)
    })

    it('responds with 400 when "personality.realName" is missing', function(done) {
      this.agent
        .post('/servers')
        .send({
          name: 'quakenet',
          serverUrl: 'irc.quakenet.org',
          personality: {
            nick: 'orvari2'
          },
          channels: ['#pwirc-quakenet-testing-1']
        })
        .expect(400, done)
    })

    it('responds with 400 when "channels" is missing', function(done) {
      this.agent
        .post('/servers')
        .send({
          name: 'quakenet',
          serverUrl: 'irc.quakenet.org',
          personality: {
            nick: 'orvari2',
            realName: 'pwirc-test-user'
          }
        })
        .expect(400, done)
    })
  })
})
