"use strict"

!(function (window, undefined) {
  var PROMISE_STATUE = {
    PENDING: 'pending',
    RESOLVE: 'resolved',
    REJECT: 'rejected'
  }

  function Promise(handle) {
    if (!isFunction(handle)) throw new TypeError(`Promise resolver ${handle} is not a function`)
    this['[[PromiseStatus]]'] = PROMISE_STATUE.PENDING
    this['[[PromiseValue]]'] = null
    this['[[PromiseOnFulfilledQuene]]'] = []
    this['[[PromiseOnRejectedQuene]]'] = []
    try {
      handle.call(this, this._resolve.bind(this), this._reject.bind(this))
    } catch (error) {
      this._reject(error)
    }
  }

  Promise.prototype.then = function (resolve, reject) {
    var PromiseStatus = this['[[PromiseStatus]]']
    var PromiseValue = this['[[PromiseValue]]']
    var PromiseOnFulfilledQuene = this['[[PromiseOnFulfilledQuene]]']
    var PromiseOnRejectedQuene = this['[[PromiseOnRejectedQuene]]']
    return new Promise((nextResolve, nextReject) => {
      var method = {
        resolved: function (value) {
          try {
            if (!isFunction(resolve)) {
              nextResolve(value)
            } else {
              var result = resolve(value)
              if (result instanceof Promise) {
                result.then(nextResolve, nextReject)
              } else {
                nextResolve(result)
              }
            }
          } catch (error) {
            nextReject(error)
          }
        },
        rejected: function (value) {
          try {
            if (!isFunction(reject)) {
              nextReject(value)
            } else {
              var result = reject(value)
              if (result instanceof Promise) {
                result(nextResolve, nextReject)
              } else {
                nextReject(result)
              }
            }
          } catch (error) {
            nextReject(error)
          }
        }
      }
      switch (PromiseStatus) {
        case PROMISE_STATUE.PENDING:
          PromiseOnFulfilledQuene.push(method.resolved)
          PromiseOnRejectedQuene.push(method.rejected)
          break
        case PROMISE_STATUE.RESOLVE:
          method.resolved(PromiseValue)
          break
        case PROMISE_STATUE.REJECT:
          method.rejected(PromiseValue)
          break
      }
    })
  }

  Promise.prototype.catch = function (reject) {
    return this.then(null, reject)
  }

  Promise.prototype.finally = function (cb) {
    return this.then(function (result) {
      Promise.resolve(cb()).then(function () {
        return result
      })
    }, function (error) {
      Promise.resolve(cb()).then(function () {
        throw error
      })
    })
  }

  Promise.prototype.finally = function (cb) {
    return this.then(function (result) {
      Promise.resolve(cb()).then(function () {
        return result
      })
    }, function (error) {
      Promise.resolve(cb()).then(function () {
        throw error
      })
    })
  }

  Promise.prototype._resolve = function (value) {
    if (this['[[PromiseStatus]]'] !== PROMISE_STATUE.PENDING) return
    var self = this
    var run = function () {
      self['[[PromiseStatus]]'] = PROMISE_STATUE.RESOLVE
      self['[[PromiseValue]]'] = value
      var cb
      while (cb = self['[[PromiseOnFulfilledQuene]]'].shift()) {
        cb(self['[[PromiseValue]]'])
      }
    }
    setTimeout(() => run())
  }

  Promise.prototype._reject = function (value) {
    if (this['[[PromiseStatus]]'] !== PROMISE_STATUE.PENDING) return
    var self = this
    var run = function () {
      self['[[PromiseStatus]]'] = PROMISE_STATUE.REJECT
      self['[[PromiseValue]]'] = value
      var cb
      while (cb = self['[[PromiseOnRejectedQuene]]'].shift()) {
        cb(self['[[PromiseValue]]'])
      }
    }
    setTimeout(() => run())
  }

  Promise.resolve = function (target) {
    if (target instanceof Promise) return target
    return new Promise(function (resolve) {
      return resolve(target)
    })
  }

  Promise.reject = function (target) {
    return new Promise(function (resolve, reject) {
      return reject(target)
    })
  }

  Promise.all = function () {
    var args = arguments
    return new Promise(function (resolve, reject) {
      var promiseResult = []
      var resolveCount = 0
      for (var i in args) {
        var curPromise = args[i]
        Promise.resolve(curPromise)
          .then(function (result) {
            promiseResult[i] = result
            resolveCount++
            if (resolveCount === args.length) resolve(promiseResult)
          }, function (error) {
            reject(error)
          })
      }
    })
  }

  Promise.race = function () {
    var args = arguments
    return new Promise(function (resolve, reject) {
      for (var i in args) {
        var curPromise = args[i]
        Promise.resolve(curPromise)
          .then(function (result) {
            resolve(result)
          }, function (error) {
            reject(error)
          })
      }
    })
  }

  function isFunction(target) {
    return typeof target === 'function'
  }

  window.Promise = Promise
})(window)