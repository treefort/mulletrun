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


var buster         = require('bustermove')
  , assert         = require('referee').assert
  , refute         = require('referee').refute
  , path           = require('path')
  , enderPackage   = require('ender-package')
  , repository     = require('ender-repository')
  , repositoryUtil = require('ender-repository').util
  , requireSubvert = require('require-subvert')(__dirname)
  , install        = require('..')

  , DependencyLoopError = require('../lib/errors').DependencyLoopError


buster.testCase('Install', {
    setUp: function () {
      this.makePackage = function (name, version, dependencies, relativeRoot) {
        version = version || '0.0.0'
        dependencies = dependencies || []
        relativeRoot = relativeRoot || path.join('node_modules', name)

        return {
            root: path.resolve(relativeRoot)
          , id: name + '@' + version
          , name: name
          , originalName: name
          , version: version
          , dependencies: dependencies
          , loadDescriptor: setImmediate
          , unload: function () {}
        }
      }

      this.createStubs = function (local, repo) {
        this.stub(repository, 'setup').callsArg(0)
        this.stub(repository, 'packup')

        this.stub(repository, 'install', function (ids, callback) {
          setImmediate(function () {
            var basePackageIds = [], installedRoots = []

            ids.forEach(function (id) {
              var pkg = repo.filter(function (pkg) { return pkg.id == id || pkg.root == path.resolve(id) })[0]
              if (!pkg) return callback("Not found!")
              pkg.root = path.resolve(path.join('node_modules', pkg.name))
              local.unshift(pkg)
              basePackageIds.push(pkg.id)
              installedRoots.push(pkg.root)
            })

            callback(null, basePackageIds, installedRoots)
          })
        })


        // It would be simpler to stub loadPackage, but findPackage holds a local reference,
        //  so we have to move up the food chain and stub LocalPackage.create
        this.stub(enderPackage.LocalPackage, 'create', function (root) {
          root = path.resolve(root)

          var pkg = local.filter(function (pkg) { return pkg.root == root })[0]
            , nullPkg = {
                  loadDescriptor: function (cb) { cb('Bad package') }
                , unload: function () {}
              }

          return pkg || nullPkg
        })
      }.bind(this)
    }

  , tearDown: function () {
      repository.setup.restore()
      repository.packup.restore()
      repository.install.restore()
      enderPackage.LocalPackage.create.restore()
    }

  , 'test basic one package install, already available': function (done) {
      var localPackages = [
              this.makePackage('foo', '0.0.1')
          ]
        , repoPackages = []
        , ids = [ 'foo' ]
        , refresh = false

      this.createStubs(localPackages, repoPackages)

      install(ids, refresh, function (err, basePackageIds, installedIds) {
        refute(err)
        assert.equals(basePackageIds, [ 'foo@0.0.1' ])
        assert.equals(installedIds.length, 0)
        done()
      }.bind(this))
    }

  , 'test one package install, not available': function (done) {
      var localPackages = []
        , repoPackages = [
              this.makePackage('foo', '0.0.1')
          ]
        , ids = [ 'foo@0.0.1' ]
        , refresh = false

      this.createStubs(localPackages, repoPackages)

      install(ids, refresh, function (err, basePackageIds, installedIds) {
        refute(err)
        assert.equals(basePackageIds, [ 'foo@0.0.1' ])
        assert.equals(installedIds.length, 1)
        done()
      }.bind(this))
    }

  , 'test one package install, needs update': function (done) {
      var localPackages = [
              this.makePackage('foo', '0.0.1')
          ]
        , repoPackages = [
              this.makePackage('foo', '1.2.3')
          ]
        , ids = [ 'foo@1.2.3' ]
        , refresh = false

      this.createStubs(localPackages, repoPackages)

      install(ids, refresh, function (err, basePackageIds, installedIds) {
        refute(err)
        assert.equals(basePackageIds, [ 'foo@1.2.3' ])
        assert.equals(installedIds.length, 1)
        done()
      }.bind(this))
    }

  , 'test install path package, already available (should install anyway)': function (done) {
      var localPackages = [
              this.makePackage('foo', '0.0.1')
            , this.makePackage('foo', '0.0.1', [], '../foo')
          ]
        , repoPackages = [
              this.makePackage('foo', '0.0.1', [], '../foo')
          ]
        , ids = [ '../foo' ]
        , refresh = false

      this.createStubs(localPackages, repoPackages)

      install(ids, refresh, function (err, basePackageIds, installedIds) {
        refute(err)
        assert.equals(basePackageIds, [ 'foo@0.0.1' ])
        assert.equals(installedIds.length, 1)
        done()
      }.bind(this))
    }

  , 'test multi package install, multi install loops required': function (done) {
      var localPackages = []
        , repoPackages = [
              this.makePackage('foo', '0.0.1', ['bar@1.2.3'])
            , this.makePackage('bar', '1.2.3', ['baz@2.0.1'])
            , this.makePackage('baz', '2.0.1', ['bat@0.1.0'])
            , this.makePackage('bat', '0.1.0', [])
          ]
        , ids = [ 'foo@0.0.1' ]
        , refresh = false

      this.createStubs(localPackages, repoPackages)

      install(ids, refresh, function (err, basePackageIds, installedIds) {
        refute(err)
        assert.equals(basePackageIds, [ 'foo@0.0.1' ])
        assert.equals(installedIds.length, 4)
        done()
      }.bind(this))
    }  

  , 'unresolvable dependency loop': function (done) {
      var localPackages = []
        , repoPackages = [
              this.makePackage('foo', '0.0.1', ['bar@1.2.3'])
            , this.makePackage('bar', '1.2.3', ['foo@1.0.0'])
            , this.makePackage('foo', '1.0.0', ['bar@2.3.4'])
            , this.makePackage('bar', '2.3.4', ['foo@0.0.1'])
          ]
        , ids = [ 'foo@0.0.1' ]
        , refresh = false

      this.createStubs(localPackages, repoPackages)

      install(ids, refresh, function (err, basePackageIds, installedIds) {
        assert(err)
        assert(err instanceof DependencyLoopError)
        ass
        done()
      }.bind(this))
    }  
})