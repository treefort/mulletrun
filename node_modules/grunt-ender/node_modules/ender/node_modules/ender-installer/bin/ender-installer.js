#!/usr/bin/env node

var enderInstaller  = require('../')
  , argsParser      = require('ender-args-parser')
  , enderPackage    = require('ender-package')
  , options         = argsParser.parseClean(['build'].concat(process.argv.slice(2)))
  , refresh         = options['force-install'] || options['_force-install']

if (!options.packages.length) {
  console.error('Usage: ender-installer <package1>[ <package2>[ <package3> ]]')
  return process.exit(-1)
}

enderInstaller(options.packages, refresh, function (err, ids, installResults) {
  if (err) throw err

  enderPackage.buildArchyTree(ids, true, function (err, archyTree) {
    if (err) throw err
    console.log(archyTree)
  })
})