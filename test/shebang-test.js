var jsmv = require('../'),
    stream = require('stream'),
    rs = stream.Readable(),
    assert = require('assert'),
    fs = require('fs')

fs.writeFileSync(__dirname + '/testfile.js', fs.readFileSync(__dirname +
  '/dummyfile3.js'))

rs._read = function() {
  rs.push(__dirname + '/testfile.js')
  rs.push(null)
}

rs.pipe(jsmv({ from: 'a', to: 'b', relative_to: false }))
  .on('end', verify_change)

function verify_change() {
  var file_contents = fs.readFileSync(__dirname + '/testfile.js', 'utf8')
  fs.unlinkSync(__dirname + '/testfile.js')

  assert.equal("#!/shebangs/shebangs\nvar test = require('b')\n",
      file_contents)
}
