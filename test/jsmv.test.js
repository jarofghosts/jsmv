var jsmv = require('../')
  , stream = require('stream')
  , test = require('tape')
  , fs = require('fs')

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
  var rs = stream.Readable()

  rs._read = function() {
    rs.push(__dirname + '/testfile1.js')
    rs.push(null)
  }

  rs.pipe(jsmv({from: 'a', to: __dirname + '/b', relative_to: true}))
    .on('end', verify_change)

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile1.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile1.js')

    t.equal("var test = require('./b')\n", file_contents)

    t.end()
  }
})

test('rewrite works with named modules', function(t) {
  var rs = stream.Readable()

  rs._read = function() {
    rs.push(__dirname + '/testfile2.js')
    rs.push(null)
  }

  rs.pipe(jsmv({ from: __dirname + '/a.js', to: 'b', relative_to: false }))
    .on('end', verify_change)

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile2.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile2.js')

    t.equal("var test = require('b')\n", file_contents)

    t.end()
  }
})

test('switches named modules', function(t) {
  var rs = stream.Readable()

  rs._read = function() {
    rs.push(__dirname + '/testfile3.js')
    rs.push(null)
  }

  rs.pipe(jsmv({ from: 'a', to: 'b', relative_to: false }))
    .on('end', verify_change)

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile3.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile3.js')

    t.equal("var test = require('b')\n", file_contents)

    t.end()
  }
})

test('does not explode when js file has a shebang', function(t) {
  var rs = stream.Readable()

  rs._read = function() {
    rs.push(__dirname + '/testfile4.js')
    rs.push(null)
  }

  rs.pipe(jsmv({ from: 'a', to: 'b', relative_to: false }))
    .on('end', verify_change)

  function verify_change() {
    var file_contents = fs.readFileSync(__dirname + '/testfile4.js', 'utf8')
    fs.unlinkSync(__dirname + '/testfile4.js')

    t.equal("#!/shebangs/shebangs\nvar test = require('b')\n", file_contents)

    t.end()
  }
})
