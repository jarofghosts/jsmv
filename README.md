jsmv
====

[![Build Status](http://img.shields.io/travis/jarofghosts/jsmv.svg?style=flat)](https://travis-ci.org/jarofghosts/jsmv)
[![npm install](http://img.shields.io/npm/dm/jsmv.svg?style=flat)](https://www.npmjs.org/package/jsmv)

move around module names

## installation

`npm install -g jsmv`

## why

so you can do `jsmv old-module.js new-module.js`

or even

`jsmv modules/my-request.js request`

## usage

`jsmv [options] [from] [to]`

Options are:

* `--from, -f <modulename>` Find files that require `<modulename>`
* `--to, -t <modulename>` Rename all matches to `<modulename>`
* `--dir, -d <dir>` Search javascript files in `<dir>` (default CWD)
* `--file, -F <file>` Only search `<file>` for relevant modules
* `--recurse, -r` Recurse into subdirectories
* `--version, -v` Print current version
* `--help, -h` This thing

if `--from` and `--to` are not explicitly declared, the first two non-flag
command line options will be used in their place respectively.

## license

MIT
