#!/usr/bin/env node

const repository = require('../')

var args = process.argv.slice(2)
  , cmd = args.shift()

  , exec = {
        install   : repository.install.bind(repository)
      , uninstall : repository.uninstall.bind(repository)
      , search    : function (args, callback) {
          repository.search(args, function (err, data) {
            if (err) return callback(err)
            console.log(Object.keys(data).map(function (key) {
              return data[key].name + '\t' + data[key].description
            }).join('\n'))
            callback()
          })
        }
    }

if (exec[cmd] && args.length) {
  return repository.setup(function (err) {
    if (err) throw err
    exec[cmd](args, function (err) {
      if (err) throw err
      repository.packup()
    })
  })
}

console.error(
    'Usage:'
  + '\n\tender-repository search <keywords>'
  + '\n\tender-repository install <packages>'
  + '\n\tender-repository uninstall <packages>'
)