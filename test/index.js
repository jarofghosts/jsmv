var path = require('path')
  , fs = require('fs')

var test = require('tape')

var jsmv = require('../')

fs.writeFileSync(
    path.join(__dirname, 'testfile1.js')
  , fs.readFileSync(path.join(__dirname, 'dummyfile.js'))
)

fs.writeFileSync(
    path.join(__dirname, 'testfile2.js')
  , fs.readFileSync(path.join(__dirname, 'dummyfile2.js'))
)

fs.writeFileSync(
    path.join(__dirname, 'testfile3.js')
  , fs.readFileSync(path.join(__dirname, 'dummyfile.js'))
)

fs.writeFileSync(
    path.join(__dirname, 'testfile4.js')
  , fs.readFileSync(path.join(__dirname, 'dummyfile3.js'))
)

fs.writeFileSync(
    path.join(__dirname, 'testfile5.js')
  , fs.readFileSync(path.join(__dirname, 'dummyfile4.js'))
)

test('change from named to relative module', function(t) {
  var stream = jsmv('a', path.join(__dirname, 'b'), {relativeTo: true})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile1.js'))

  function verifyChange() {
    var fileContents = fs.readFileSync(
        path.join(__dirname, 'testfile1.js')
      , 'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile1.js'))

    t.equal("var test = require('./b')\n", fileContents)

    t.end()
  }
})

test('rewrite works with named modules', function(t) {
  var stream = jsmv(path.join(__dirname, 'a.js'), 'b', {relativeTo: false})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile2.js'))

  function verifyChange() {
    var fileContents = fs.readFileSync(
        path.join(__dirname, 'testfile2.js')
      , 'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile2.js'))

    t.equal("var test = require('b')\n", fileContents)

    t.end()
  }
})

test('switches named modules', function(t) {
  var stream = jsmv('a', 'b', {relativeTo: false})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile3.js'))

  function verifyChange() {
    var fileContents = fs.readFileSync(
        path.join(__dirname, 'testfile3.js')
      , 'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile3.js'))

    t.equal("var test = require('b')\n", fileContents)

    t.end()
  }
})

test('does not explode when js file has a shebang', function(t) {
  var stream = jsmv('a', 'b', {relativeTo: false})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile4.js'))

  function verifyChange() {
    var fileContents = fs.readFileSync(
        path.join(__dirname, 'testfile4.js')
      , 'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile4.js'))

    t.equal("#!/shebangs/shebangs\nvar test = require('b')\n", fileContents)

    t.end()
  }
})

test('can provide aliases', function(t) {
  var stream = jsmv('a', 'b', {require: ['wutever', 'require']})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile5.js'))

  function verifyChange() {
    var fileContents = fs.readFileSync(
        path.join(__dirname, 'testfile5.js')
      , 'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile5.js'))

    t.equal(
        "var test = wutever('b')\nvar herp = require('b')\n" + 
            "var derp = nope('a')\n"
      , fileContents
    )

    t.end()
  }
})
