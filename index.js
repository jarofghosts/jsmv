var path = require('path')
var util = require('util')
var fs = require('fs')

var select = require('cssauron-falafel')
var escape = require('quotemeta')
var through = require('through')
var falafel = require('falafel')
var noop = require('nop')

var CWD = process.cwd()
var hasExtension = /\.js$/
var lazyRequire = /\/$/
var relative = /^\./
var shebang = /^#!/

module.exports = jsmv

function jsmv (from, to, _options) {
  var stream = through(parseFiles, noop)
  var options = _options || {}
  var started = false
  var files = []
  var aliases = (options.require || ['require']).map(toSelector)

  if (options.dir) {
    CWD = path.resolve(options.dir)
  }

  return stream

  function parseFiles (chunk) {
    files.push(chunk.toString())

    if (!started) {
      started = true
      readFile(files.shift())
    }

    function readFile (filename) {
      fs.readFile(path.resolve(CWD, filename), 'utf8', processFile)

      function processFile (err, data) {
        if (err) {
          return stream.emit('error', err)
        }

        var hadShebang = false
        var processed

        if (shebang.test(data)) {
          hadShebang = true
          data = '//' + data
        }

        data = 'function _() {\n' + data + '\n}'

        stream.emit('read', filename)

        processed = falafel(data, parseNode).toString()

        if (data === processed) {
          return next()
        }

        stream.queue(filename)

        processed = processed.slice(hadShebang ? 17 : 15, -2)
        fs.writeFile(path.resolve(CWD, filename), processed, next)

        function parseNode (node) {
          var required = isRequire(node)
          var reqString
          var deepRex
          var moveTo
          var quote

          if (!required) {
            return
          }

          reqString = required.value

          deepRex = new RegExp('^' + escape(from) + '/.+')

          if (relative.test(reqString)) {
            if (lazyRequire.test(reqString)) {
              reqString += 'index.js'
            }

            if (!hasExtension.test(reqString)) {
              reqString += '.js'
            }

            reqString = path.resolve(path.dirname(filename), reqString)
          }

          if (from !== reqString && !deepRex.test(reqString)) {
            return
          }

          quote = node.source()[0]

          if (from === reqString) {
            moveTo = options.relativeTo ? path.relative(path.dirname(filename), to) : to

            if (options.relativeTo) {
              if (!relative.test(moveTo)) {
                moveTo = (/\//.test(moveTo) ? '.' : './') + moveTo
              }

              if (hasExtension.test(moveTo)) {
                moveTo = moveTo.slice(0, -3)
              }
            }

            return node.update(quote + moveTo + quote)
          }

          if (options.force || options.forceFull) {
            moveTo = options.forceFull ? to : reqString.replace(new RegExp('^' + escape(from)), to)

            return node.update(quote + moveTo + quote)
          }

          stream.emit('conflict', {file: filename, string: reqString})
        }
      }
    }

    function next () {
      if (!files.length) {
        return stream.queue(null)
      }

      readFile(files.shift())
    }
  }

  function isRequire (node) {
    var result

    for (var i = 0, len = aliases.length; i < len; ++i) {
      result = aliases[i](node)

      if (result) {
        return result
      }
    }
  }
}

function toSelector (alias) {
  var selector = util.format('call > id[name=%s]:first-child + literal', alias)

  return select(selector)
}
