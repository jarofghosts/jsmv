#!/usr/bin/env node

var nopt = require('nopt'),
    jsmv = require('../'),
    fs = require('fs'),
    lsstream = require('ls-stream'),
    filter = require('stream-police'),
    file_stream = require('stream').Readable(),
    through = require('through'),
    dps = require('dotpath-stream'),
    path = require('path'),
    package = require('../package.json'),
    ignore_node_modules = through(filter_entry),
    noptions = {
      version: Boolean,
      help: Boolean,
      dir: String,
      file: Array,
      from: String,
      to: String
    },
    shorts = {
      v: ['--version'],
      h: ['--help'],
      d: ['--dir'],
      F: ['--file'],
      f: ['--from'],
      t: ['--to']
    },
    options = nopt(noptions, shorts, process.argv),
    input

options.from = options.from || options.argv.remain[0]
options.to = options.to || options.argv.remain[1]

if (options.version) return version()
if (options.help || !options.from || !options.to) return help()

file_stream._read = function push_files() {
  if (!options.file) return this.push(null)

  for (var i = 0, l = options.file.length; i < l; ++i) {
    this.push(options.file[i])
  }

  this.push(null)
}

if (options.file) {
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
  fs.createReadStream(path.join(__dirname, '../help.txt')).pipe(process.stdout)
}

function check_from(is_relative) {
  options.relative_to = is_relative
  fs.exists(path.resolve(process.cwd(), options.from), run_jsmv)
}

function run_jsmv(is_relative) {
  if (is_relative) options.from = path.resolve(process.cwd(), options.from)

  input
    .pipe(filter({ verify: [/\.js$/] }))
    .pipe(jsmv(options))
    .pipe(process.stdout)
}

function filter_entry(entry) {
  var rel = path.resolve(path.join(entry.path, '..')),
      name = entry.path.replace(rel + '/', ''),
      ignore

  ignore = [
    '.git',
    '.hg',
    '.svn',
    'node_modules'
  ].indexOf(name) === -1

  ignore = ignore && entry.stat.isDirectory()
  if (ignore) {
    entry.ignore()
  }

  this.queue(entry)
}
