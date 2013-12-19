#!/usr/bin/env node

var nopt = require('nopt'),
    jsmv = require('../'),
    fs = require('fs'),
    lsstream = require('ls-stream'),
    filter = require('stream-police'),
    file_stream = require('stream').Readable(),
    dps = require('dotpath-stream'),
    split = require('split'),
    path = require('path'),
    package = require('../package.json'),
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
  input = lsstream(path.resolve(options.dir)).pipe(dps('path'))
} else {
  input = lsstream(process.cwd()).pipe(dps('path'))
}

options.from = options.from || options.argv.remain[0]
options.to = options.to || options.argv.remain[1]

if (!options.from || !options.to) return help()

fs.exists(options.to, run_jsmv)

function version() {
  process.stdout.write('jsmv version ' + package.version + '\n')
}

function help() {
  version()
  fs.createReadStream(path.join(__dirname, '../help.txt')).pipe(process.stdout)
}

function run_jsmv(is_relative) {
  options.relative_to = is_relative

  input
    .pipe(filter({ verify: [/\.js$/] }))
    .pipe(jsmv(options))
    .pipe(process.stdout)
}
