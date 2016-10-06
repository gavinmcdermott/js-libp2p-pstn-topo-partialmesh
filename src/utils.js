'use strict'

const Q = require('q')
const R = require('ramda')
const debug = require('debug')
const chalk = require('chalk')
const readline = require('readline')

const log = debug('pstn:topo:ring')
log.err = debug('pstn:topo:ring:error')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
})

const logProgress = (data) => {
  const prefix = chalk.blue('progress')
  rl.write(null, { ctrl: true, name: 'u' })
  rl.write(`${prefix}: ${data}`)
}

const resolveList = (fns) => {
  const fn = R.head(fns.splice(0, 1))
  logProgress(`${fns.length} resolutions remaining...`)

  if (!fns.length) return true

  // delay is needed to break the recursion and prevent larger memory leaks
  // http://stackoverflow.com/questions/15027192/how-do-i-stop-memory-leaks-with-recursive-javascript-promises
  return Q.delay(1).then(fn).then(() => resolveList(fns))
}

module.exports = { resolveList, log }
