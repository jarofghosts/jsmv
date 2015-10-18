# jsmv

[![Build Status](http://img.shields.io/travis/jarofghosts/jsmv.svg?style=flat-square)](https://travis-ci.org/jarofghosts/jsmv)
[![npm install](http://img.shields.io/npm/dm/jsmv.svg?style=flat-square)](https://www.npmjs.org/package/jsmv)
[![npm version](https://img.shields.io/npm/v/jsmv.svg?style=flat-square)](https://www.npmjs.org/package/jsmv)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![License](https://img.shields.io/npm/l/jsmv.svg?style=flat-square)](https://github.com/jarofghosts/jsmv/blob/master/LICENSE)

replace requires across your codebase

## installation

`npm install -g jsmv`

## why

so you can do `jsmv old-module.js new-module.js` to replace all `require`s for
`old-module.js` to `new-module.js`. it will even take care of making sure all
of your relative paths are correct!

or even `jsmv modules/my-request.js request` to replace any `require` for
`modules/my-request.js` with the actual `request` module.

## usage

`jsmv [options] [from] [to]`

options are:

* `--from, -f <modulename>` Find files that require `<modulename>`
* `--to, -t <modulename>` Rename all matches to `<modulename>`
* `--require, -R <name>` Look for `name` vs. `require`
* `--dir, -d <dir>` Search javascript files in `<dir>` (default CWD)
* `--file, -F <file>` Only search `<file>` for relevant modules
* `--recurse, -r` Recurse into subdirectories
* `--force` In the event of a deep-require, replace the module anyway
* `--forceFull` For deep-requires, replace the whole require with `[to]`
* `--version, -v` Print current version
* `--help, -h` This thing

if `--from` and `--to` are not explicitly declared, the first two non-flag
command line options will be used in their place respectively.

## license

MIT
