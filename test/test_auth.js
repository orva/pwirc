const R = require('ramda')
const path = require('path')
const should = require('should')
const sinon = require('sinon')

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

const stubs = require('./stubs')
const auth = require('../server/auth')


describe('Auth', () => {
  const filename = path.join(__dirname, '.test_auth_config.json')
  const pwd = 'testpassword'
  const conf = stubs.config()

  before(() => {
    const jsonStr = JSON.stringify(conf)
    return fs.writeFileAsync(filename, jsonStr, 'utf8')
  })

  after(() => fs.unlinkAsync(filename))


  describe('strategyHandler', () => {
    const handler = auth.strategyHandler(filename)
    const callWithSpy = (username, password) => {
      const spy = sinon.spy()
      handler(username, password, spy)
      return spy
    }

    it('calls done with user when password matches', () => {
      const user = conf.user
      const spy = callWithSpy(user.username, pwd)

      return Promise.delay(175)
        .then(() => should(spy.calledWith(null, user)).be.true())
    })

    it('calls done with false when password does not match', () => {
      const user = conf.user
      const spy = callWithSpy(user.username, 'invalid password')

      return Promise.delay(175)
        .then(() => should(spy.calledWith(null, false)).be.true())
    })

    it('calls done with false when username does not match', () => {
      const spy = callWithSpy('invaliduser', pwd)

      return Promise.delay(25)
        .then(() => should(spy.calledWith(null, false)).be.true())
    })

    it('calls done with false when config does not have user', () => {
      // non existing config gives default config, which does not contain user
      const noUserHandler = auth.strategyHandler('/tmp/does/not.exist.json')
      const spy = sinon.spy()
      noUserHandler('username', 'password', spy)
      return Promise.delay(25)
        .then(() => should(spy.calledWith(null, false)).be.true())
    })
  })

  describe('serializeUser', () => {
    it('calls done with user.username', () => {
      const spy = sinon.spy()
      auth.serializeUser({ username: 'username', password: 'password' }, spy)
      return Promise.delay(25)
        .then(() => should(spy.calledWith(null, 'username')).be.true())
    })
  })

  describe('deserializeUser', () => {
    it('fetches the (only) user from the configfile', () => {
      const spy = sinon.spy()
      const expected = R.omit('password', conf.user)
      const deserializer = auth.deserializeUser(filename)
      deserializer(undefined, spy)

      return Promise.delay(25)
        .then(() => should(spy.calledWith(null, expected)).be.true())
    })
  })
})
