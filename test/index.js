var path = require('path')
var fs = require('fs')

var test = require('tape')

var jsmv = require('../')

fs.writeFileSync(
  path.join(__dirname, 'testfile1.js'),
  fs.readFileSync(path.join(__dirname, 'dummyfile.js'))
)

fs.writeFileSync(
  path.join(__dirname, 'testfile2.js'),
  fs.readFileSync(path.join(__dirname, 'dummyfile2.js'))
)

fs.writeFileSync(
  path.join(__dirname, 'testfile3.js'),
  fs.readFileSync(path.join(__dirname, 'dummyfile.js'))
)

fs.writeFileSync(
  path.join(__dirname, 'testfile4.js'),
  fs.readFileSync(path.join(__dirname, 'dummyfile3.js'))
)

fs.writeFileSync(
  path.join(__dirname, 'testfile5.js'),
  fs.readFileSync(path.join(__dirname, 'dummyfile4.js'))
)

fs.writeFileSync(
  path.join(__dirname, 'testfile6.js'),
  fs.readFileSync(path.join(__dirname, 'dummyfile5.js'))
)

test('change from named to relative module', function (t) {
  var stream = jsmv('a', path.join(__dirname, 'b'), {relativeTo: true})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile1.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile1.js'),
      'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile1.js'))

    t.equal("var test = require('./b')\n", fileContents)

    t.end()
  }
})

test('rewrite works with named modules', function (t) {
  var stream = jsmv(path.join(__dirname, 'a.js'), 'b', {relativeTo: false})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile2.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile2.js'),
      'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile2.js'))

    t.equal("var test = require('b')\n", fileContents)

    t.end()
  }
})

test('switches named modules', function (t) {
  var stream = jsmv('a', 'b', {relativeTo: false})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile3.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile3.js'),
      'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile3.js'))

    t.equal("var test = require('b')\n", fileContents)

    t.end()
  }
})

test('does not explode when js file has a shebang', function (t) {
  var stream = jsmv('a', 'b', {relativeTo: false})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile4.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile4.js'),
      'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile4.js'))

    t.equal("#!/shebangs/shebangs\nvar test = require('b')\n", fileContents)

    t.end()
  }
})

test('can provide aliases', function (t) {
  var stream = jsmv('a', 'b', {require: ['wutever', 'require']})

  stream.on('end', verifyChange)
  stream.write(path.join(__dirname, 'testfile5.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile5.js'),
      'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile5.js'))

    t.equal(
      "var test = wutever('b')\nvar herp = require('b')\n" +
          "var derp = nope('a')\n",
        fileContents
    )

    t.end()
  }
})

test('emits conflict on deep-require', function (t) {
  var stream = jsmv('a', 'b')

  stream.on('end', verifyChange)
  stream.on('conflict', function (obj) {
    t.equal(obj.string, 'a/c')
    t.equal(obj.file, path.join(__dirname, 'testfile6.js'))
  })

  stream.write(path.join(__dirname, 'testfile6.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile6.js'),
      'utf8'
    )

    t.equal("var test = require('a/c')\n", fileContents)

    t.end()
  }
})

test('overwrites module name on force', function (t) {
  var stream = jsmv('a', 'b', {force: true})

  stream.on('end', verifyChange)

  stream.write(path.join(__dirname, 'testfile6.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile6.js'),
      'utf8'
    )

    t.equal("var test = require('b/c')\n", fileContents)

    t.end()
  }
})

test('replaces fully with forceFull', function (t) {
  var stream = jsmv('b', 'd', {forceFull: true})

  stream.on('end', verifyChange)

  stream.write(path.join(__dirname, 'testfile6.js'))

  function verifyChange () {
    var fileContents = fs.readFileSync(
      path.join(__dirname, 'testfile6.js'),
      'utf8'
    )

    fs.unlinkSync(path.join(__dirname, 'testfile6.js'))

    t.equal("var test = require('d')\n", fileContents)

    t.end()
  }
})
