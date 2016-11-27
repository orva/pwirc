const path = require('path')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')

const session = require('express-session')
const FileStore = require('session-file-store')(session)
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const SocketIO = require('socket.io')
const R = require('ramda')
const Promise = require('bluebird')

const irc = require('./irc_server')
const serverState = require('./irc_server_state')
const channel = require('./channel_filter')
const config = require('./config')
const auth = require('./auth')

const configFile = path.join(__dirname, '../data/configuration.json')

const app = express()
const httpServer = http.Server(app)
const io = SocketIO(httpServer)

const servers = serverState.create()

servers.events.on('server-added', srv => {
  serverBroadcasts(io, srv)
  io.emit('channels-updated', serverState.allChannels(servers))
})

passport.use(new LocalStrategy(auth.strategyHandler(configFile)))
passport.serializeUser(auth.serializeUser)
passport.deserializeUser(auth.deserializeUser(configFile))

const ensureAuthenticated = (req, res, next) => {
  if (req.path === '/login' || req.path === '/login.html') {
    next()
    return
  }

  if (!req.user) {
    res.redirect('/login')
  } else {
    next()
  }
}

app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, '../dist')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
  store: new FileStore({ path: './data/sessions' }),
  secret: 'banana split',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(ensureAuthenticated)

app.get('/',
  (req, res) => res.sendFile(path.join(__dirname, './html/index.html')))

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, './html/login.html')))

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login', successRedirect: '/' }))

app.post('/logout', (req, res) => {
  req.logout()
  res.redirect('/login')
})

app.post('/messages/:server/:to', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || !req.body.msg) {
    res.status(404).end()
    return
  }

  const server = serverState.find(servers, req.params.server)
  if (!server) {
    res.status(404).end()
    return
  }

  // If target is channel, it needs to exist
  if (irc.isChannelName(server, req.params.to) &&
      !serverState.isExistingChannel(servers, req.params.server, req.params.to)) {
    res.status(404).end()
    return
  }

  irc.say(req.params.to, req.body.msg, server)
  res.status(200).end()
})

app.post('/channels/:server/:chan', (req, res) => {
  const server = serverState.find(servers, req.params.server)
  if (!server ||
      !irc.isChannelName(server, req.params.chan) ||
      serverState.isExistingChannel(servers, req.params.server, req.params.chan)) {
    res.status(404).end()
    return
  }

  irc.join(server, req.params.chan)
  res.status(200).end()
})

app.get('/channels/:server/:chan', (req, res) => {
  if (!req.accepts('html') ||
      !serverState.isExistingChannel(servers, req.params.server, req.params.chan)) {
    res.status(404).end()
    return
  }

  res.sendFile(path.join(__dirname, './html/index.html'))
})

app.get('/servers', (req, res) => {
  config.load(configFile)
    .then(conf => {
      const connected = R.map(R.pick(['name', 'serverUrl', 'nick', 'realName']), servers.servers)
      const available = conf.servers
      res.json({
        connected: connected,
        available: available
      })
    })
})

app.post('/servers', ({ body: { name, serverUrl, personality, channels } }, res) => {
  if (!exists(personality)) {
    res.status(400).end()
    return
  }

  const { nick, realName } = personality

  if (!exists(name) || !exists(serverUrl) || !exists(nick) || !exists(realName) || !exists(channels)) {
    res.status(400).end()
    return
  }

  const srv = irc.connect(name, serverUrl, nick, {
    channels,
    realName,
    userName: nick
  })
  res.status(202).end()
  serverState.add(servers, srv)
})


io.on('connection', sock => {
  const currentChan = channel.create(servers)

  sock.on('disconnect', () => {
    channel.close(currentChan)
  })

  sock.on('switch', chan => {
    const state = channel.switchChannel(currentChan, chan)
    sock.emit('channel-switched', state)
  })

  forwardEventToClient(currentChan, sock, 'message')
  forwardEventToClient(currentChan, sock, 'private-message')
  forwardEventToClient(currentChan, sock, 'names')
  forwardEventToClient(currentChan, sock, 'event-join')

  sock.emit('channels-updated', serverState.allChannels(servers))

  const initialState = channel.initialState(currentChan)
  if (initialStateIsStable(initialState)) {
    sock.emit('channel-switched', initialState)
  }

  sock.emit('welcome')
})

const forwardEventToClient = (currentChan, sock, type) =>
  currentChan.events.on(type, payload => sock.emit(type, payload))

const initialStateIsStable = state =>
  (!R.isEmpty(state) && exists(state.server) && exists(state.channel))

const exists = v => (!R.isNil(v) && !R.isEmpty(v))

config.load(configFile)
  .then(conf => {
    console.log('Following config loaded:', conf)

    const connected = R.prop('connected', conf) || []
    const ircs = R.map(reconnectIrcServer, connected)
    R.forEach(R.curry(serverState.add)(servers), ircs)

    const listen = Promise.promisify(httpServer.listen).bind(httpServer)
    return listen(31337)
  })
  .tap(() => {
    console.log('server started, port 31337')
  })

const reconnectIrcServer = ({ serverName, serverUrl, nick, channels }) =>
  irc.connect(serverName, serverUrl, nick, { channels })

const serverBroadcasts = (sockIO, server) => {
  server.events.on('channel-joined', () => {
    sockIO.emit('channels-updated', serverState.allChannels(servers))
  })
}


module.exports = app
