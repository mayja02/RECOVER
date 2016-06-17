var url = require('url')

exports.isGitUrl = isGitUrl
function isGitUrl (u) {
  var p = url.parse(u) || {}

  switch (p.protocol) {
    case 'git:':
    case 'git+http:':
    case 'git+https:':
    case 'git+rsync:':
    case 'git+ftp:':
    case 'git+ssh:':
    case 'git+file:':
      return true
  }
  return /\.git$/.test(p.path)
}

exports.isGitHubUrl = isGitHubUrl
function isGitHubUrl (u) {
  if (u && /^git@github\.com:/.test(u)) return true
  var p = url.parse(u) || {}
  return p.hostname === 'github.com'
}

exports.isGistUrl = isGistUrl
function isGistUrl (u) {
  var p = url.parse(u) || {}
  return p.hostname === 'gist.github.com'
}