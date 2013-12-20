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
    input,
    options = nopt(noptions, shorts, process.argv)

if (options.version) return version()
if (options.help) return help()

file_stream._read = function () {
  var self = this

  options.file && options.file.forEach(function (file) {
    self.push(file)
  })
  self.push(null)
}

if (options.file) {
  input = file_stream
} else if (options.dir) {
  input = lsstream(path.resolve(options.dir)).pipe(ignore_node_modules).pipe(dps('path'))
} else {
  input = lsstream(process.cwd()).pipe(ignore_node_modules).pipe(dps('path'))
}

options.from = options.from || options.argv.remain[0]
options.to = options.to || options.argv.remain[1]

if (!options.from || !options.to) return help()

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
  var rel = path.resolve(path.join(entry.path, '..'))
    , name = entry.path.replace(rel + '/', '')
    , ignore

  ignore = [
    '.git',
    '.hg',
    '.svn',
    'node_modules'
  ].indexOf(name) === -1

  ignore = ignore && entry.stat.isDirectory()
  if(ignore) {
    entry.ignore()
  }

  this.queue(entry)
}
