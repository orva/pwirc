const Promise = require('bluebird')
const scrypt = require('scrypt')
const config = require('./config')

const strategyHandler = configfile => (username, password, done) =>
  config.load(configfile)
    .then(conf => {
      if (!conf || !conf.user) {
        // TODO config not found error
        done(null, false)
        return
      }

      const usr = conf.user.username
      const pwd = conf.user.password

      if (!usr || !username || username !== usr ||
          !pwd || !password) {
        done(null, false)
        return
      }

      return isPasswordValid(conf.user.password, password)
        .then(valid => valid ? done(null, conf.user) : done(null, false))
    })

const serializeUser = (user, done) => done(null, user.username)
const deserializeUser = configfile => (username, done) =>
  config.load(configfile).then(conf => done(null, conf.user))

const isPasswordValid = (storedPassword, password) => {
  const buf = Buffer.from(storedPassword, 'hex')
  return Promise.resolve(scrypt.verifyKdf(buf, password))
    .catch(() => false)
}

module.exports = {
  strategyHandler,
  serializeUser,
  deserializeUser
}
