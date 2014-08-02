var path = require('path')
  , fs = require('fs')

var select = require('cssauron-falafel')
  , through = require('through')
  , falafel = require('falafel')

var CWD = process.cwd()

module.exports = jsmv

function jsmv(_options) {
  var isRequire = select('call > id[name=require]:first-child + literal')
    , stream = through(parseFiles, Function())
    , options = _options || {}
    , hasExtension = /\.js$/
    , lazyRequire = /\/$/
    , relative = /^\./
    , shebang = /^#!/
    , started = false
    , files = []
    , total = 0

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
        var hadShebang = false
          , found = false
          , reqString
          , required
          , quote
          , to

        if(shebang.test(data)) {
          hadShebang = true
          data = '//' + data
        }

        data = 'function _() {\n' + data + '\n}'

        stream.queue({filename: filename})

        data = '' + falafel(data, parseNode)
        
        stream.queue({filename: filename, changed: found})

        if(!found) return next()

        data = data.slice((hadShebang ? 17 : 15), -2)

        fs.writeFile(path.resolve(CWD, filename), data, next)

        function parseNode(node) {
          required = isRequire(node)

          if(!required) return

          reqString = required.value

          if(relative.test(reqString)) {
            if(lazyRequire.test(reqString)) reqString += 'index.js'
            if(!hasExtension.test(reqString)) reqString += '.js'
            reqString = path.resolve(path.dirname(filename), reqString)
          }

          if(options.from === reqString) {
            found = true

            to = options.relativeTo ?
                path.relative(path.dirname(filename), options.to) :
                options.to

            if(options.relativeTo) {
              if(!relative.test(to)) to = (/\//.test(to) ? '.' : './') + to
              if(hasExtension.test(to)) to = to.slice(0, -3)
            }

            quote = node.source()[0]
            node.update(quote + to + quote)

            ++total
          }
        }
      }
    }

    function next() {
      if(!files.length) {
        stream.queue({total: total})
        return stream.queue(null)
      }

      readFile(files.shift())
    }
  }
}
