/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var async           = require('async')
  , fs              = require('fs')
  , path            = require('path')
  , enderPackage    = require('ender-package')
  , repository      = require('ender-repository')

  , DependencyLoopError = require('./errors').DependencyLoopError

  , installPackages = function (ids, refresh, callback) {
      var missing
        , installedIds = []

        , install = function (idsToInstall, callback) {
            repository.install(idsToInstall, function (err, receipts) {
              if (err) return callback(err) // wrapped in ender-repository

              // Unmemoize all the packages we just installed
              receipts.forEach(function (receipt) {
                installedIds.push(receipt.id)
                enderPackage.unloadPackage(receipt.root)
                enderPackage.addPackageMapping(receipt.source, receipt.root)
              })

              callback(null, receipts)
            })
          }

        , installRest = function (callback) {
            async.whilst(
                function () { return missing.length }
              , function (callback) {
                  install(missing, function (err) {
                    if (err) return callback(err)
                    updateMissing(callback)
                  })
                }
              , callback
            )
          }

        , updateMissing = function (callback) {
            enderPackage.walkDependencies(ids, true, false, function (err, packages, _missing) {
              if (err) return callback(err) // this should never happen if we don't request `strict`

              missing = _missing
              var dupes = missing.filter(function (id) { return installedIds.indexOf(id) != -1 })
              if (dupes.length)
                return callback(new DependencyLoopError('Installing identical package twice: ' + dupes))

              callback()
            })
          }

        , installBasePackages = function (callback) {
            var installPackage = function (id, callback) {
                  var doInstall = function () {
                        install([ id ], function (err) {
                          if (err) return callback(err)
                          callback(null, installedIds[installedIds.length-1])
                        })
                      }

                  // Load the package
                  enderPackage.findPackage(id, '.', function (err, pkg) {
                    // If this was a path package, we'll let npm deliver the bad news
                    if (err) doInstall()

                    // The CWD is always "installed"...
                    else if (pkg.root == path.resolve('.'))
                      // ...but we might have to refresh dependencies
                      if (refresh) install(pkg.dependencies, function (err) { callback(err, pkg.id) })
                      else callback(null, pkg.id)

                    // Are we refreshing?
                    else if (refresh) doInstall()

                    // Is the package outside the CWD (i.e., a path package)
                    else if (/^\.\./.test(path.relative('.', pkg.root))) doInstall()

                    else callback(null, pkg.id)
                  })
                }

            // Use mapSeries so we can install packages one at a time
            async.mapSeries(
                ids
              , installPackage
              , function (err, _ids) {
                  if (err) return callback(err)
                  ids = _ids.filter(function (id, i) { return _ids.indexOf(id) == i })
                  callback()
                }
            )
          }

      async.series(
          [
              repository.setup.bind(repository)
            , installBasePackages
            , updateMissing
            , installRest
          ]
        , function (err) {
            repository.packup(err)
            if (err) return callback(err)
            callback(null, ids, installedIds)
          }
      )
    }

module.exports = installPackages