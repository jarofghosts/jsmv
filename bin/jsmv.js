#!/usr/bin/env node

var fileStream = require('stream').Readable()
  , path = require('path')
  , fs = require('fs')

var singleLog = require('single-line-log')(process.stdout)
  , filter = require('stream-police')
  , lsstream = require('ls-stream')
  , dps = require('dotpath-stream')
  , through = require('through')
  , nopt = require('nopt')

var package = require('../package.json')
  , jsmv = require('../')

var CWD = process.cwd()

var ignoreNodeModules = through(filterEntry)

var noptions = {
    version: Boolean
  , help: Boolean
  , recurse: Boolean
  , dir: String
  , file: Array
  , from: String
  , to: String
}

var shorts = {
    v: ['--version']
  , r: ['--recurse']
  , h: ['--help']
  , d: ['--dir']
  , F: ['--file']
  , f: ['--from']
  , t: ['--to']
}

var options = nopt(noptions, shorts, process.argv)
  , input

options.from = options.from || options.argv.remain[0]
options.to = options.to || options.argv.remain[1]

if(options.version) return version()
if(options.help || !options.from || !options.to) return help()

fileStream._read = function pushFiles() {
  if(!options.file || !options.file.length) return this.push(null)

  this.push(options.file.shift())
}

if(options.file) {
  input = fileStream
} else {
  input = lsstream(options.dir ? path.resolve(options.dir) : CWD)
    .pipe(ignoreNodeModules)
    .pipe(dps('path'))
}

fs.exists(path.resolve(CWD, options.to), checkFrom)

function version() {
  process.stderr.write('jsmv version ' + package.version + '\n')
}

function help() {
  version()
  fs.createReadStream(
      path.join(__dirname, '..', 'help.txt')
  ).pipe(process.stderr)
}

function checkFrom(isRelative) {
  options.relativeTo = isRelative
  fs.exists(path.resolve(CWD, options.from), runJsmv)
}

function runJsmv(isRelative) {
  if(isRelative) options.from = path.resolve(CWD, options.from)

  input
    .pipe(filter({verify: [/\.js$/]}))
    .pipe(jsmv(options))
    .pipe(through(display))
}

function display(file) {
  file.filename = file.filename.slice(CWD.length + 1)

  if(file.hasOwnProperty('total')) {
    singleLog('\nUpdated ' + file.total + ' total occurence' +
        (file.total !== 1 ? 's' : ''))

    return process.stdout.write('\n')
  }

  singleLog('... ' + file.filename)

  if(file.changed) {
    singleLog('✓ ' + file.filename)
    singleLog.clear()
    process.stdout.write('\n')
  }
}

function filterEntry(entry) {
  var name = path.basename(entry.path)
    , ignore

  ignore = [
      '.git'
    , '.hg'
    , '.svn'
    , 'node_modules'
  ].indexOf(name) > -1

  ignore = (ignore || !options.recurse) && entry.stat.isDirectory()

  if(ignore) return entry.ignore()

  ignoreNodeModules.queue(entry)
}
