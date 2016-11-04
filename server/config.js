const Promise = require('bluebird')

const path = require('path')
const fs = Promise.promisifyAll(require('fs'))


const load = filename =>
  fs.readFileAsync(filename, 'utf8')
    .then(contents => JSON.parse(contents))
    .catch(SyntaxError, () => defaults())
    .catch({code: 'ENOENT'}, () => defaults())

const save = (filename, conf) => {
  const jsonString = JSON.stringify(conf)
  return fs.writeFileAsync(filename, jsonString, 'utf8')
}

const defaults = () => {
  const defaultsFile = path.join(__dirname, 'default_configuration.json')
  return fs.readFileAsync(defaultsFile, 'utf8')
    .then(conf => JSON.parse(conf))
}

module.exports = {
  load,
  save
}
