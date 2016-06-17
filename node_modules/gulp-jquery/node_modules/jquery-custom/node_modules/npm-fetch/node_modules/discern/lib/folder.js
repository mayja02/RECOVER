var fs = require('fs')
var join = require('path').join
var normalize = require('./normalize')

module.exports = discern
function discern(dir, cb) {
  fs.readFile(join(dir, '.git/config'), 'utf8', function (er, gconf) {
    if (er) return cb(er)
    var url
    try {
      url = parse(gconf)
    } catch (ex) {
      return cb(ex)
    }
    cb(null, url)
  })
}

discern.sync = discernSync
function discernSync(dir) {
  var gconf
  try {
    gconf = fs.readFileSync(join(dir, '.git/config'), 'utf8')
  } catch (ex) {
    throw ex
  }
  return parse(gconf)
}

function parse(gconf) {
  gconf = gconf.split(/\r?\n/)
  var i = gconf.indexOf('[remote "origin"]')
  if (i !== -1) {
    var u = gconf[i + 1]
    if (!u.match(/^\s*url =/)) u = gconf[i + 2]
    if (u.match(/^\s*url =/)) return normalize(u.replace(/^\s*url = /, ''))
  }
  return null
}