# Ender Args Parser [![Build Status](https://secure.travis-ci.org/ender-js/ender-args-parser.png)](http://travis-ci.org/ender-js/ender-args-parser)

A component of the [Ender CLI](https://github.com/ender-js/Ender/).

Parse command line arguments in a posix(ish) way. Unfortunately, due to historical reasons, Ender doesn't use pure posix-style command line arguments so a custom parser is required. This may change in the future as we evolve the parser and deprecate old arguments.

At some point we may expose a more configurable interface to make this library more useful but for now everything is hard-wired in the code.

## About Ender

For more information check out [http://ender.jit.su](http://ender.jit.su)

## API

### parse(argv)
`parse()` takes a standard `process.argv` array and returns an *options* object. Two key components of the *options* object are the `'main'` property which is a string pointing to the main command specified on the command line (e.g. `$ ender build ...` where `'main'` is `'build'`) and `'packages'` which is an array of strings listing any non-option-prefixed portions of the argument list (e.g. `$ ender build --output foo bar baz` where `'packages'` is `[ 'bar', 'baz' ]` because `'foo'` belongs to the `--output` option).

A relatively complete options object created from a command line string could look like this (taken from the unit tests):

```sh
$ ender build fee fie foe fum --output foobar --use yeehaw --max 10 \
  --sandbox foo bar --silent --help --debug --externs what tha \
  --client-lib BOOM --quiet --force-install --minifier none
```
→

```json
{
    "main"          : "build"
  , "packages"      : [ "fee", "fie", "foe", "fum" ]
  , "output"        : "foobar"
  , "use"           : "yeehaw"
  , "max"           : 10
  , "sandbox"       : [ "foo", "bar" ]
  , "silent"        : true
  , "help"          : true
  , "debug"         : true
  , "externs"       : [ "what", "tha" ]
  , "client-lib"    : "BOOM"
  , "quiet"         : true
  , "force-install" : true
  , "minifier"      : "none"
}
```

### parseClean(argv)
`parseClean()` is exactly the same as `parse()` but takes a list of arguments without the first 2 that are present on `process.argv`.

### extend(originalArgs, newArgs)
`extend()` will take an *options* object and intelligently combine it with a new *options* object. This is used for Ender commands such as `add` and `remove` which take an existing file (where the command line is saved in the header) and alter the original command line options to create a new set of options.

### toContextString(options)
`toContextString()` is the reverse of `parse()` in that it can take an *options* object and turn it back into a command line string. Mainly used for attaching command line options to the header of an Ender build file.

Even if short-hand command line options were used (e.g. `-o`), `toContextString()` will use the long-hand versions (e.g. `--output`).

-------------------------

## Contributing

Contributions are more than welcome! Just fork and submit a GitHub pull request! If you have changes that need to be synchronized across the various Ender CLI repositories then please make that clear in your pull requests.

### Tests

Ender Args Parser uses [Buster](http://busterjs.org) for unit testing. You'll get it (and a bazillion unnecessary dependencies) when you `npm install` in your cloned local repository. Simply run `npm test` to run the test suite.

## Licence

*Ender Args Parser* is Copyright (c) 2012 [@rvagg](https://github.com/rvagg), [@ded](https://github.com/ded), [@fat](https://github.com/fat) and other contributors. It is licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.