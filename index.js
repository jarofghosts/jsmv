var through = require('through'),
    select = require('cssauron-falafel'),
    falafel = require('falafel'),
    fs = require('fs'),
    path = require('path'),
    CWD = process.cwd()

module.exports = jsmv

function jsmv(options) {
  var is_require = select('call id[name=require]:first-child + literal'),
      stream = through(parse_files, noop),
      has_extension = /\.js$/,
      lazy_require = /\/$/,
      relative = /^\./,
      shebang = /^#!/,
      started = false,
      files = [],
      total = 0

  if (options.dir) CWD = path.resolve(options.dir)

  return stream

  function parse_files(chunk) {
    files.push(chunk.toString())
    if (!started) {
      started = true
      read_file(files.shift())
    }

    function read_file(filename) {
      fs.readFile(path.resolve(CWD, filename), 'utf8', process_file)

      function process_file(err, data) {
        var had_shebang = false,
            req_string,
            required,
            quote,
            to

        if (shebang.test(data)) {
          had_shebang = true
          data = '//' + data
        }

        data = 'function ____() {\n' + data + '\n}'

        data = '' + falafel(data, function(node) {
          required = is_require(node)
          if (!required) return

          req_string = required.value

          if (relative.test(req_string)) {
            if (lazy_require.test(req_string)) req_string += 'index.js'
            if (!has_extension.test(req_string)) req_string += '.js'
            req_string = path.resolve(path.dirname(filename), req_string)
          }

          if (options.from === req_string) {
            stream.queue('Updating ' + filename + '...\n')

            to = options.relative_to ?
              path.relative(path.dirname(filename), options.to) :
              options.to

            if (options.relative_to) {
              if (!relative.test(to)) to = (/\//.test(to) ? '.' : './') + to
              if (has_extension.test(to)) to = to.slice(0, -3)
            }

            quote = node.source()[0]

            node.update(quote + to + quote)

            total++
          }
        })

        data = data.slice(18, -2)

        if (had_shebang) {
          data = data.slice(2)
        }

        fs.writeFile(path.resolve(CWD, filename), data, next)
      }
    }
    function next() {
      if (!files.length) {
        stream.queue('Updated ' + total + ' occurrences.\n')
        return stream.queue(null)
      }
      read_file(files.shift())
    }
  }
}

function noop() {}
