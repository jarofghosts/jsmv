var fs = require('fs')

var test = require('tape')

var jsmv = require('../')

fs.writeFileSync(
    __dirname + '/testfile1.js'
  , fs.readFileSync(__dirname + '/dummyfile.js')
)

fs.writeFileSync(
    __dirname + '/testfile2.js'
  , fs.readFileSync(__dirname + '/dummyfile2.js')
)

fs.writeFileSync(
    __dirname + '/testfile3.js'
  , fs.readFileSync(__dirname + '/dummyfile.js')
)

fs.writeFileSync(
    __dirname + '/testfile4.js'
  , fs.readFileSync(__dirname + '/dummyfile3.js')
)

test('change from named to relative module', function(t) {
  var stream = jsmv({from: 'a', to: __dirname + '/b', relativeTo: true})

  stream.on('end', verify_change)
  stream.write(__dirname + '/testfile1.js')

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile1.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile1.js')

    t.equal("var test = require('./b')\n", file_contents)

    t.end()
  }
})

test('rewrite works with named modules', function(t) {
  var stream = jsmv({from: __dirname + '/a.js', to: 'b', relative_to: false})

  stream.on('end', verify_change)
  stream.write(__dirname + '/testfile2.js')

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile2.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile2.js')

    t.equal("var test = require('b')\n", file_contents)

    t.end()
  }
})

test('switches named modules', function(t) {
  var stream = jsmv({from: 'a', to: 'b', relative_to: false})

  stream.on('end', verify_change)
  stream.write(__dirname + '/testfile3.js')

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile3.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile3.js')

    t.equal("var test = require('b')\n", file_contents)

    t.end()
  }
})

test('does not explode when js file has a shebang', function(t) {
  var stream = jsmv({from: 'a', to: 'b', relative_to: false})

  stream.on('end', verify_change)
  stream.write(__dirname + '/testfile4.js')

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile4.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile4.js')

    t.equal("#!/shebangs/shebangs\nvar test = require('b')\n", file_contents)

    t.end()
  }
})
