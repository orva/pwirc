import path from 'path'

import Promise from 'bluebird'

import _fs from 'fs'
const fs = Promise.promisifyAll(_fs)


export function load(filename) {
  return fs.readFileAsync(filename, 'utf8')
    .then(contents => JSON.parse(contents))
    .catch(SyntaxError, () => defaults())
    .catch({code: 'ENOENT'}, () => defaults())
}

export function save(filename, conf) {
  const jsonString = JSON.stringify(conf)
  return fs.writeFileAsync(filename, jsonString, 'utf8')
}

function defaults() {
  const defaultsFile = path.join(__dirname, 'default_configuration.json')
  return fs.readFileAsync(defaultsFile, 'utf8')
    .then(conf => JSON.parse(conf))
}
