'use strict'

class TopoError extends Error {
  constructor (message, extra) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = `TopoError`
    this.message = `${message}`
    if (extra) this.extra = extra
  }
}

module.exports = { TopoError }
