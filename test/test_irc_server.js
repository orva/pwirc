describe('IrcServer', function() {
  describe('connect', function() {
    it('constructs irc.Client with provided parameters')
    it('offers event emitter')
    it('stores provided server name')
    it('stores provided server url')
    it('stores listeners attached to irc.Client')
  })

  describe('join', function() {
    it('calls irc.join with provided channel')
    it('fails if already joined the channel')
    it('fails if channel is not proper channel name')
  })

  describe('close', function() {
    it('removes event listeners from irc connection')
    it('does remove events-field from the object')
  })

  describe('say', function() {
    it('calls irc.say with provided target and channel')
    it('succeeds when target is not channel')
    it('fails if target is non-present channel')
  })

  describe('messages', function() {
    it('returns array of all messages in provided channel')
    it('returns array of all messages in provided conversation')
    it('returns empty array for non-present target')
  })

  describe('conversations', function() {
    it('returns array of all conversations with users')
    it('returns empty array when there is no conversation history')
  })

  describe('channels', function() {
    it('returns channel names from irc.chans')
    it('returns empty array if there is no channels')
  })

  describe('events', function() {
    describe('message', function() {
      it('is emitted when channels receives message')
      it('is emitted when user says something')
      it('is payload can be found with messages-call')
      it('contains expected fields in payload')
    })

    describe('private-message', function() {
      it('is emitted when someone messages user directly')
      it('is emitted when user messages someone directly')
      it('contains expected fields in payload')
    })

    describe('channel-joined', function() {
      it('is emitted when user joins a channel')
      it('is not emitted someone else joins a channel')
      it('contains expected fields in payload')
    })

    describe('channel-left', function() {
      it('is emitted when user leaves a channel')
      it('is not emitted someone else leaves a channel')
      it('contains expected fields in payload')
    })

    describe('join', function() {
      it('is emitted when someone else joins a channel')
      it('is not emitted when user joins a channel')
      it('contains expected fields in payload')
    })

    describe('part', function() {
      it('is emitted when someone else parts a channel')
      it('is not emitted when user parts a channel')
      it('contains expected fields in payload')
    })

    describe('action', function() {
      it('is emitted when someone else does an action in channel')
      it('is emitted when user does an action in channel')
      it('contains expected fields in payload')
    })
  })

  describe('log storage', function() {
    it('stores log files under "./data"')
    it('has excepted filename')
    it('has own logfile for every channel')
  })
})
