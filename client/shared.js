const R = require('ramda')

const dashedKey = R.pipe(
  R.reject(R.isNil),
  R.intersperse('-'),
  R.join(''))

module.exports = {
  dashedKey
}


