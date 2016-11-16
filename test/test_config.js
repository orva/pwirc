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
      .then(() => fs.unlinkAsync(that.filename).catch(() => undefined))
      .then(() => fs.writeFileAsync(that.filename, jsonStr, 'utf8'))
  })

  afterEach(function() {
    return fs.unlinkAsync(this.filename)
  })

  describe('load', function() {
    it('gives default configuration when file does not exist', function() {
      const that = this

      return config.load('/tmp/does-not-exist')
        .then(conf => {
          should.deepEqual(conf, that.defaults)
        })
    })

    it('gives default configuration when file contains garbage', function() {
      const that = this

      return fs.writeFileAsync(that.filename, '{{}-----', 'utf8')
        .then(() => {
          return config.load(that.filename)
        })
        .then(conf => {
          should.deepEqual(conf, that.defaults)
        })
    })

    it('gives contents of the file if it exists', function() {
      const that = this

      return config.load(that.filename)
        .then(conf => {
          should.deepEqual(conf, that.configs)
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
    })

    it('prettifyes the content', function() {
      const that = this

      return config.save(that.filename, that.configs)
        .then(() => {
          return fs.readFileAsync(that.filename, 'utf8')
        })
        .then(rawJson => {
          const expected = JSON.stringify(that.configs, null, 2)
          should.equal(rawJson, expected)
        })

    })
  })
})
