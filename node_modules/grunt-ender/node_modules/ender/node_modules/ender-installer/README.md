# Ender Installer [![Build Status](https://secure.travis-ci.org/ender-js/ender-installer.png)](http://travis-ci.org/ender-js/ender-installer)

A component of the [Ender CLI](https://github.com/ender-js/Ender/), providing an additional layer on top of Ender's [npm](http://npmjs.org/) wrapper [Ender Repository](https://github.com/ender-js/ender-repository).

Installing packages is not as simple as just asking npm to install them, there is additional logic we need in order to get exactly what we want and also to control npm (in particular, npm needs '.' to be installed separately). Our install logic allows us to install more than just the standard package.json "dependencies", we can also install "ender"->"dependencies". We also get to skip installing dependencies that already exist which the npm API doesn't allow us to do directly. The basic flow is: (1) check dependency status in node_modules, (2) ask npm to install anything missing, (3) repeat until there's not left to install. One special case is that we *always* ask npm to install packages specified
by a path (i.e. local).

## Executable

If you install with `npm install ender-installer -g` then you'll get an `ender-installer` executable that you can use to install npm packages, the Ender way. Combined with the executable in [Ender Builder](https://github.com/ender-js/ender-builder) you'd have complete Ender install & build tools separate from the main Ender CLI.

The executable obeys the `--force-install` command; without it, it'll not *reinstall* packages that have already been installed.


```sh
$ ender-installer ender-js bonzo bean traversty --force-install
```

## About Ender

For more information check out [http://ender.jit.su](http://ender.jit.su)

## API

### enderInstaller(options, packages, callback)
Ender Installer exports a single main function that performs the installation. The `options` object can contain a `'force-install'` boolean (i.e. from `--force-install` on the command line) that will force an install from npm even if the package is already installed in *node_modules* (`'_force-install'` is an alternative and is used upstream to indicate that the option shouldn't be saved to the build file's command line string, i.e. `ender refresh` does a `--force-install` but that option isn't left in the build file).

The `packages` argument is an array of packages to be installed, npm-style so they can contain `@semver`s and even be filesystem paths.

The `callback` has the signature: `function (err, npmResults, dependencyGraph)` where `npmResults` is an array of results from [Ender Repository](https://github.com/ender-js/ender-repository)'s `install()` function and `dependencyGraph` is a `DependencyGraph` object generated from [Ender Dependency Graph](https://github.com/ender-js/ender-dependency-graph).

-------------------------

## Contributing

Contributions are more than welcome! Just fork and submit a GitHub pull request! If you have changes that need to be synchronized across the various Ender CLI repositories then please make that clear in your pull requests.

### Tests

Ender Installer uses [Buster](http://busterjs.org) for unit testing. You'll get it (and a bazillion unnecessary dependencies) when you `npm install` in your cloned local repository. Simply run `npm test` to run the test suite.

## Licence

*Ender Installer* is Copyright (c) 2012 [@rvagg](https://github.com/rvagg), [@ded](https://github.com/ded), [@fat](https://github.com/fat) and other contributors. It is licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.