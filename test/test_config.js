import path from 'path'
import Promise from 'bluebird'
import should from 'should'

import _fs from 'fs'
const fs = Promise.promisifyAll(_fs)

import * as config from '../server/config'

describe('config', function() {
  beforeEach(function() {
    this.filename = path.join(__dirname, '.test_config.json')
    this.configs = {
      connected: [
        {
          serverName: 'freenode',
          connectedUrl: 'chat.freenode.net',
          nick: 'test-user',
          realName: 'John Doe',
          channels: ['#test1', '#test2']
        }
      ],
      servers: {
        freenode: ['chat.freenode.net'],
        quakenet: ['irc.quakenet.com']
      }
    }

    const jsonStr = JSON.stringify(this.configs)
    const defaultsFile = path.join(__dirname, '../server/default_configuration.json')

    return fs.readFileAsync(defaultsFile, 'utf8')
      .tap(defs => {
        this.defaults = JSON.parse(defs)
      })
      .then(fs.writeFileAsync(this.filename, jsonStr, 'utf8'))
  })

  afterEach(function() {
    return fs.unlinkAsync(this.filename)
  })

  describe('load', function() {
    it('gives default configuration when file does not exist', function(done) {
      config.load('/tmp/does-not-exist')
        .then(conf => {
          should.deepEqual(conf, this.defaults)
          done()
        })
    })

    it('gives default configuration when file contains garbage', function(done) {
      fs.writeFileAsync(this.filename, '{{}', 'utf8')
        .then(() => {
          return config.load(this.filename)
        })
        .then(conf => {
          should.deepEqual(conf, this.defaults)
          done()
        })
    })

    it('gives contents of the file if it exists', function(done) {
      config.load(this.filename)
        .then(conf => {
          should.deepEqual(conf, this.configs)
          done()
        })
    })
  })

  describe('save', function() {
    it('stringifies content and writes it to filename', function() {
      return config.save(this.filename, this.configs)
        .then(() => {
          return fs.readFileAsync(this.filename, 'utf8')
        })
        .then(rawJson => {
          should.deepEqual(this.configs, JSON.parse(rawJson))
        })
        .should.be.fulfilled()
    })
  })
})
