var through = require('through'),
    select = require('cssauron-falafel'),
    falafel = require('falafel'),
    fs = require('fs'),
    path = require('path'),
    CWD = process.cwd()

module.exports = jsmv

function jsmv(options) {
  var files = [],
      started = false,
      relative = /^\./,
      total = 0,
      is_require = select('call id[name=require]:first-child + literal'),
      stream = through(parse_files, noop)

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
        var split_data = data.split('\n'),
            required,
            req_string,
            line_number,
            replace_rex,
            code,
            lines,
            column,
            to

        data = 'function ____() {\n' + data.replace(/^#!(.*?)\n/, '\n') + '\n}'

        falafel(data, function(node) {
          required = is_require(node)
          if (!required) return

          req_string = required.value

          if (relative.test(req_string)) {
            if (/\/$/.test(req_string)) req_string += 'index.js'
            if (!/\.(js|json)$/.test(req_string)) req_string += '.js'
            req_string = path.resolve(path.dirname(filename), req_string)
          }

          if (options.from === req_string) {
            total++
            stream.queue('Updating ' + filename + '...\n')
            code = data.slice(0, node.range[0])
            lines = code.split('\n')
            column = lines[lines.length - 1].length + 1
            to = options.relative_to ?
              path.relative(path.dirname(filename), options.to) :
              options.to

            if (options.relative_to) {
              if (!/^\./.test(to)) to = (/\//.test(to) ? '.' : './') + to
              if (/\.js$/.test(to)) to = to.slice(-3)
            }

            line_number = code.match(/\n/g).length
            replace_rex = new RegExp('(.{' + column + '})' +
              required.value)

            split_data[line_number - 1] = split_data[line_number - 1].replace(
              replace_rex,
              '$1' + to
            )
          }
        })

        fs.writeFile(path.resolve(CWD, filename), split_data.join('\n'), next)

        function next() {
          if (!files.length) {
            stream.queue('Updated ' + total + ' occurrences.\n')
            return stream.queue(null)
          }
          read_file(files.shift())
        }
      }
    }
  }
}

function noop() {}
