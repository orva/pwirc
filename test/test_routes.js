import R from 'ramda'
import request from 'supertest'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import * as stubs from './stubs'
import * as irc from '../server/irc_server'

describe('Routes', function() {
  before(function() {
    const ircStub = sinon.stub(irc)
    ircStub.connect.returns(stubs.server())
    ircStub.isChannelName.returns(true)
    ircStub.channels.returns(['#first', '#second'])

    const serversStub = {}
    serversStub.isExistingChannel = (_, srv, chan) => {
      return srv === 'freenode' && R.contains(chan, ['#first', '#second'])
    }
    serversStub.find = (_, name) => name === 'freenode' ? stubs.server() : undefined

    this.ircStub = ircStub
    this.app = proxyquire('../server/http_handlers', {
      './irc_server': ircStub,
      './irc_server_state': serversStub
    })
  })

  afterEach(function() {
    this.ircStub.isChannelName.returns(true)
  })

  describe('POST /messages/:server/:target', function() {
    it('responds 200 when server, target and body are supplied', function(done) {
      request(this.app)
        .post('/messages/freenode/%23first')
        .send({ msg: 'test message' })
        .expect(200, done)
    })

    it('responds 404 when both server and target are not present', function(done) {
      request(this.app)
        .post('/messages/freenode')
        .send({ msg: 'test message' })
        .expect(404, done)
    })

    it('responds 404 to empty body', function(done) {
      request(this.app)
        .post('/messages/freenode/%23first')
        .send('')
        .expect(404, done)
    })

    it('responds 404 when body does not contain "msg" field', function(done) {
      request(this.app)
        .post('/messages/freenode/%23first')
        .send({ fails: true })
        .expect(404, done)
    })

    it('responds 404 when server does not exist', function(done) {
      request(this.app)
        .post('/messages/does_not_exist/%23first')
        .send({ msg: 'test message'})
        .expect(404, done)
    })

    it('responds 404 when target is channel and does not exist', function(done) {
      request(this.app)
        .post('/messages/freenode/%23does_not_exist')
        .send({ msg: 'test message' })
        .expect(404, done)
    })

    it('responds 200 when target is not channel', function(done) {
      this.ircStub.isChannelName.returns(false)

      request(this.app)
        .post('/messages/freenode/nick')
        .send({ msg: 'test message' })
        .expect(200, done)
    })
  })

  describe('POST /channels/:server/:chan', function() {
    it('responds 200 to valid server and chan', function(done) {
      request(this.app)
        .post('/channels/freenode/%23third')
        .expect(200, done)
    })

    it('responds 404 to not connected server', function(done) {
      request(this.app)
        .post('/channels/invalid/%23third')
        .expect(404, done)
    })

    it('responds 404 to invalid channel name', function(done) {
      this.ircStub.isChannelName.returns(false)

      request(this.app)
        .post('/channels/freenode/not_valid_channel_name')
        .expect(404, done)
    })

    it('responds 404 to channel already present', function(done) {
      request(this.app)
        .post('/channels/freenode/%23first')
        .expect(404, done)
    })
  })

  describe('GET /channels/:server/:chan', function() {
    it('responds 200 to valid server and chan', function(done) {
      request(this.app)
        .get('/channels/freenode/%23first')
        .set('Accept', 'text/html')
        .expect(200, done)
    })

    it('responds 404 to other than "Accept - application/html"', function(done) {
      request(this.app)
        .get('/channels/freenode/%23first')
        .set('Accept', 'application/json')
        .expect(404, done)
    })

    it('responds 404 when both server and chan are not present', function(done) {
      request(this.app)
        .get('/channels/freenode/')
        .set('Accept', 'text/html')
        .expect(404, done)
    })

    it('responds 404 when server does not exist', function(done) {
      request(this.app)
        .get('/channels/failnode/%23first')
        .set('Accept', 'text/html')
        .expect(404, done)
    })

    it('responds 404 when channel does not exist', function(done) {
      request(this.app)
        .get('/channels/failnode/%23third')
        .set('Accept', 'text/html')
        .expect(404, done)
    })

    it('responds 404 to invalid channel name', function(done) {
      this.ircStub.isChannelName.returns(false)

      request(this.app)
        .post('/channels/freenode/not_valid_channel_name')
        .expect(404, done)
    })
  })
})
