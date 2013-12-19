var jsmv = require('../'),
    stream = require('stream'),
    rs = stream.Readable(),
    assert = require('assert'),
    fs = require('fs')

fs.writeFileSync(__dirname + '/testfile.js', fs.readFileSync(__dirname +
  '/dummyfile.js'))

rs._read = function() {
  rs.push(__dirname + '/testfile.js')
  rs.push(null)
}

rs.pipe(jsmv({ from: 'a', to: __dirname + '/b', relative_to: true }))
  .on('end', verify_change)

function verify_change() {
  var file_contents = fs.readFileSync(__dirname + '/testfile.js', 'utf8')
  fs.unlinkSync(__dirname + '/testfile.js')

  assert.equal("var test = require('./b')\n", file_contents)
}
