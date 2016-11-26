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
          !pwd || !password || password !== pwd) {
        done(null, false)
        return
      }

      done(null, conf.user)
    })

const serializeUser = (user, done) => done(null, user.username)
const deserializeUser = configfile => (username, done) =>
  config.load(configfile).then(conf => done(null, conf.user))


module.exports = {
  strategyHandler,
  serializeUser,
  deserializeUser
}
