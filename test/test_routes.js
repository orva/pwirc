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

  it('reponds with 200 when both server and target supplied', function(done) {
    request(this.app)
      .post('/messages/freenode/%23first')
      .send({ msg: 'test' })
      .expect(200, done)
  })

  it('reponds with 404 when not both server and target are present', function(done) {
    request(this.app)
      .post('/messages/freenode')
      .send({ msg: 'test' })
      .expect(404, done)
  })

  it('reponds with 404 with empty body', function(done) {
    request(this.app)
      .post('/messages/freenode/%23first')
      .send('')
      .expect(404, done)
  })

  it('reponds with 404 body does not contain "msg" field', function(done) {
    request(this.app)
      .post('/messages/freenode/%23first')
      .send({ fails: true })
      .expect(404, done)
  })


  it('responds with 404 when channel does not exist')
})
