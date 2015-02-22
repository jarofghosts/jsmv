var path = require('path')
  , util = require('util')
  , fs = require('fs')

var select = require('cssauron-falafel')
  , escape = require('quotemeta')
  , through = require('through')
  , falafel = require('falafel')

var CWD = process.cwd()

module.exports = jsmv

function jsmv(from, to, _options) {
  var stream = through(parseFiles, Function())
    , options = _options || {}
    , hasExtension = /\.js$/
    , lazyRequire = /\/$/
    , relative = /^\./
    , shebang = /^#!/
    , started = false
    , files = []

  var aliases = options.require || ['require']

  if(options.dir) CWD = path.resolve(options.dir)

  return stream

  function parseFiles(chunk) {
    files.push(chunk.toString())

    if(!started) {
      started = true
      readFile(files.shift())
    }

    function readFile(filename) {
      fs.readFile(path.resolve(CWD, filename), 'utf8', processFile)

      function processFile(err, data) {
        if(err) {
          return stream.emit('error', err)
        }

        var hadShebang = false
          , found = false
          , reqString
          , required
          , moveTo
          , quote

        if(shebang.test(data)) {
          hadShebang = true
          data = '//' + data
        }

        data = 'function _() {\n' + data + '\n}'

        stream.emit('read', filename)

        data = '' + falafel(data, parseNode)

        if(!found) return next()

        stream.queue(filename)

        data = data.slice(hadShebang ? 17 : 15, -2)

        fs.writeFile(path.resolve(CWD, filename), data, next)

        function parseNode(node) {
          required = isRequire(node)

          if(!required) return

          reqString = required.value

          if(relative.test(reqString)) {
            if(lazyRequire.test(reqString)) reqString += 'index.js'
            if(!hasExtension.test(reqString)) reqString += '.js'

            reqString = path.resolve(path.dirname(filename), reqString)
          } else {
              if(new RegExp('^' + escape(from) + '/.+').test(reqString) &&
                  from !== reqString) {
              if(options.force || options.forceFull) {
                quote = node.source()[0]
                found = true

                moveTo = options.forceFull ?
                  to :
                  reqString.replace(new RegExp('^' + escape(from)), to)

                node.update(quote + moveTo + quote)

                return
              }

              stream.emit('conflict', {file: filename, string: reqString})

              return
            }
          }

          if(from !== reqString) return

          found = true

          moveTo = options.relativeTo ?
            path.relative(path.dirname(filename), to) :
            to

          if(options.relativeTo) {
            if(!relative.test(moveTo)) {
              moveTo = (/\//.test(moveTo) ? '.' : './') + moveTo
            }

            if(hasExtension.test(moveTo)) moveTo = moveTo.slice(0, -3)
          }

          quote = node.source()[0]
          node.update(quote + moveTo + quote)
        }
      }
    }

    function next() {
      if(!files.length) {
        return stream.queue(null)
      }

      readFile(files.shift())
    }
  }

  function isRequire(node) {
    var selector
      , result
      , alias

    for(var i = 0, len = aliases.length; i < len; ++i) {
      alias = aliases[i]
      selector = util.format('call > id[name=%s]:first-child + literal', alias)
      result = select(selector)(node)

      if(result) return result
    }
  }
}
