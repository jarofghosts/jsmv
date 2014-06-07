#!/usr/bin/env node

var file_stream = require('stream').Readable()
  , package = require('../package.json')
  , filter = require('stream-police')
  , lsstream = require('ls-stream')
  , dps = require('dotpath-stream')
  , through = require('through')
  , path = require('path')
  , nopt = require('nopt')
  , jsmv = require('../')
  , fs = require('fs')

var ignore_node_modules = through(filter_entry)

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

file_stream._read = function push_files() {
  if(!options.file || !options.file.length) return this.push(null)

  this.push(options.file.shift())
}

if(options.file) {
  input = file_stream
} else {
  input = lsstream(options.dir ? path.resolve(options.dir) : process.cwd())
    .pipe(ignore_node_modules)
    .pipe(dps('path'))
}

fs.exists(path.resolve(process.cwd(), options.to), check_from)

function version() {
  process.stdout.write('jsmv version ' + package.version + '\n')
}

function help() {
  version()
  fs.createReadStream(
      path.join(__dirname, '..', 'help.txt')
  ).pipe(process.stderr)
}

function check_from(is_relative) {
  options.relative_to = is_relative
  fs.exists(path.resolve(process.cwd(), options.from), run_jsmv)
}

function run_jsmv(is_relative) {
  if(is_relative) options.from = path.resolve(process.cwd(), options.from)

  input
    .pipe(filter({verify: [/\.js$/]}))
    .pipe(jsmv(options))
    .pipe(process.stdout)
}

function filter_entry(entry) {
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

  ignore_node_modules.queue(entry)
}
