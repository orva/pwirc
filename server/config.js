const path = require('path')

const Promise = require('bluebird')

const _fs = require('fs')
const fs = Promise.promisifyAll(_fs)


function load(filename) {
  return fs.readFileAsync(filename, 'utf8')
    .then(contents => JSON.parse(contents))
    .catch(SyntaxError, () => defaults())
    .catch({code: 'ENOENT'}, () => defaults())
}

function save(filename, conf) {
  const jsonString = JSON.stringify(conf)
  return fs.writeFileAsync(filename, jsonString, 'utf8')
}

function defaults() {
  const defaultsFile = path.join(__dirname, 'default_configuration.json')
  return fs.readFileAsync(defaultsFile, 'utf8')
    .then(conf => JSON.parse(conf))
}

module.exports = {
  load,
  save
}
