var normalize = require('./normalize')
var re = /^(?:https?:\/\/|git:\/\/|git@)?(?:[^@]+@)?github\.com[:\/]([^\/]+)\/([^\/]+?)(?:.git)?(?:#(.*))?$/

module.exports = github
function github(url) {
  try {
    url = normalize(url)
    var m = re.exec(url.replace(/\.git$/, ''))
    var user = m[1]
    var repo = m[2]
    var hash = m[3] || 'master'
    return [user, repo, hash]
  } catch (err) {
    return null
  }
}