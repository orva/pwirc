import request from 'supertest'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import * as stubs from './stubs'
import * as irc from '../server/irc_server'

describe('POST /messages/:server/:to', function() {
  before(function() {
    const ircStub = sinon.stub(irc)
    ircStub.connect.returns(stubs.server())
    ircStub.channels.returns(['#first', '#second'])

    this.ircStub = ircStub
    this.app = proxyquire('../server/http_handlers', { './irc_server': ircStub })
  })

  it('responds with 200 server, target and body are supplied', function(done) {
    request(this.app)
      .post('/messages/freenode/%23first')
      .send({ msg: 'test' })
      .expect(200, done)
  })

  it('responds with 404 when both server and target are not present', function(done) {
    request(this.app)
      .post('/messages/freenode')
      .send({ msg: 'test' })
      .expect(404, done)
  })

  it('responds with 404 to empty body', function(done) {
    request(this.app)
      .post('/messages/freenode/%23first')
      .send('')
      .expect(404, done)
  })

  it('responds with 404 when body does not contain "msg" field', function(done) {
    request(this.app)
      .post('/messages/freenode/%23first')
      .send({ fails: true })
      .expect(404, done)
  })


  it('responds with 404 when channel does not exist')
  it('responds with 404 when server does not exist')
})
