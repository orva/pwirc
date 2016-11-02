const path = require('path')
const Promise = require('bluebird')
const should = require('should')

const fs = Promise.promisifyAll(require('fs'))

const stubs = require('./stubs')
const config = require('../server/config')

describe('Config', function() {
  beforeEach(function() {
    const that = this

    that.filename = path.join(__dirname, '.test_config.json')
    that.configs = stubs.config()

    const jsonStr = JSON.stringify(that.configs)
    const defaultsFile = path.join(__dirname, '../server/default_configuration.json')

    return fs.readFileAsync(defaultsFile, 'utf8')
      .tap(defs => {
        that.defaults = JSON.parse(defs)
      })
      .then(fs.writeFileAsync(that.filename, jsonStr, 'utf8'))
  })

  afterEach(function() {
    return fs.unlinkAsync(this.filename)
  })

  describe('load', function() {
    it('gives default configuration when file does not exist', function(done) {
      const that = this

      config.load('/tmp/does-not-exist')
        .then(conf => {
          should.deepEqual(conf, that.defaults)
          done()
        })
    })

    it('gives default configuration when file contains garbage', function(done) {
      const that = this

      fs.writeFileAsync(that.filename, '{{}-----', 'utf8')
        .then(() => {
          return config.load(that.filename)
        })
        .then(conf => {
          should.deepEqual(conf, that.defaults)
          done()
        })
    })

    it('gives contents of the file if it exists', function(done) {
      const that = this

      config.load(that.filename)
        .then(conf => {
          should.deepEqual(conf, that.configs)
          done()
        })
    })
  })

  describe('save', function() {
    it('stringifies content and writes it to filename', function() {
      const that = this

      return config.save(that.filename, that.configs)
        .then(() => {
          return fs.readFileAsync(that.filename, 'utf8')
        })
        .then(rawJson => {
          should.deepEqual(that.configs, JSON.parse(rawJson))
        })
        .should.be.fulfilled()
    })
  })
})
