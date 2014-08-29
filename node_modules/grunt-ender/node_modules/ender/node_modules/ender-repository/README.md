# Ender Repository [![Build Status](https://secure.travis-ci.org/ender-js/ender-repository.png)](http://travis-ci.org/ender-js/ender-repository)

A component of the [Ender CLI](https://github.com/ender-js/Ender/), providing an interface to [npm](http://npmjs.org/), all npm interaction goes through here so it's safely abstracted away from the rest of the code.

The important parts are the `setup()` and `packup()` methods which must wrap around any call to an npm command. If you don't do a `setup()` then you'll get an error, if you don't do a `packup()` then you'll likely have a hanging-process.

These two methods manage npm initialisation and also manage an npm logfile that goes into /tmp/ender_npm_... If `packup()` is called with a falsy first arg then the log file is deleted, otherwise it is left alone for debugging.

Note that multiple npm commands can be run between `setup()` and `packup()`, they only need to be done once per app execute.

This repository may be used as a base for providing additional (non-npm) repositories for the Ender CLI.

## About Ender

For more information check out [http://ender.jit.su](http://ender.jit.su)

## API

### enderRepository.setup(callback)
`setup()` must be called prior to performing any repository operations. It will also create a 'node_modules' directory in the current working directory if one doesn't already exist. If it has previously been called within the current executing process the callback will be executed immediately.

-------------------------

### enderRepository.packup(wasError, callback)
`packup()` should be called when the repository is no longer required. The `wasError` boolean argument is used to dictate whether the log file collected from the underlying repository, npm, should be kept, otherwise it is automatically removed.

-------------------------

### enderRepository.search(keywords, callback)
`search()` is a simple interface to the standard npm search command.

Note that this is a generic npm search, not a specific Ender search, the filtering is done upstream (at the moment).

-------------------------

### enderRepository.install(packages, callback)
`install()` will install the given packages from npm. The callback is given an object containing properties for the installed `tree`, a `pretty` version of the tree and a list of `installed` packages resulting from the command.

-------------------------

### enderRepository.uninstall(packages, callback)
`uninstall()` uninstalls the given packages using npm.

-------------------------

## Executable

If you install with `npm install ender-repository -g` (why would you?) then you'll get an `ender-repository` executable that will perform `install`, `uninstall` and `search` commands.

## Contributing

Contributions are more than welcome! Just fork and submit a GitHub pull request! If you have changes that need to be synchronized across the various Ender CLI repositories then please make that clear in your pull requests.

### Tests

Ender Repository uses [Buster](http://busterjs.org) for unit testing. You'll get it (and a bazillion unnecessary dependencies) when you `npm install` in your cloned local repository. Simply run `npm test` to run the test suite.

## Licence

*Ender Repository* is Copyright (c) 2012 [@rvagg](https://github.com/rvagg), [@ded](https://github.com/ded), [@fat](https://github.com/fat) and other contributors. It is licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.