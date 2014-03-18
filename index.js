var co = require('co')
var request = require('cogent')
var channel = require('chanel')
var cp = require('child_process')
var reset = require('yield-ratelimit-reset')
var parseLink = require('parse-link-header')

var GITHUB_USERNAME = process.env.GITHUB_USERNAME
var GITHUB_PASSWORD = process.env.GITHUB_PASSWORD
if (GITHUB_PASSWORD && GITHUB_USERNAME) {
  request = request.extend({
    auth: GITHUB_USERNAME + ':' + GITHUB_PASSWORD,
  })
}

module.exports = execute

function* execute(org, user, options) {
  var state = {}
  process.on('uncaughtException', onError)
  console.log('organization: ' + org)
  console.log('user: ' + user)

  var me = yield exec('npm', ['whoami'])
  if (!me) throw new Error('log in to npm, man!')

  console.log('me: ' + me)

  var page = 1;
  var ch = channel({
    concurrency: 5,
    discard: true,
  })

  while (true) {
    console.log('searching page %s of repositories', page)
    var res = yield* request('https://api.github.com/search/repositories?q=fork:true+user:' + org + '&page=' + page, true)
    if (res.statusCode !== 200) throw new Error('error searching user\'s repos: ' + JSON.stringify(res.headers))

    var items = res.body.items
    for (var i = 0; i < items.length; i++) {
      ch.push(co(add(items[i])))
    }

    yield* reset(res.headers)

    if (!res.headers.link) break
    var links = parseLink(res.headers.link)
    if (!links.next) break

    page++
  }

  console.log('done searching for repositories')

  yield ch(true)

  console.log('you have successfully shared your developer life blood with another')

  process.removeListener('uncaughtException', onError)

  function onError() {
    Object.keys(state).forEach(function (repo) {
      state[repo] = Date.now() - state[repo]
    })
    console.log(JSON.stringify(state, null, 2))
    setImmediate(function () {
      process.exit()
    })
  }

  function* add(data) {
    if (!data.size) return
    var master = data.default_branch
    if (!master) return
    var repo = data.name
    state[repo] = Date.now()
    var res
    try {
      res = yield* request('https://raw.githubusercontent.com/' + org + '/' + repo + '/' + master + '/package.json', true)
    } catch (err) {
      return // ignore timeouts and shit
    }
    delete state[repo]
    if (res.statusCode !== 200) {
      res.resume()
      return
    }
    var json = res.body
    if (json.private) return
    var name = json.name
    if (!name) return

    var owners
    try {
      owners = yield exec('npm', ['owner', 'ls', name])
    } catch (err) {
      console.log('repo "' + name + '" isnt published on npm')
      return
    }
    // you don't have rights!
    if (!~owners.indexOf(me))
      return console.log('you dont have publishing rights to "' + name + '"')
    // this particular individual already has rights!
    if (~owners.indexOf(user))
      return console.log(user + ' already has the rights to "' + name + '"')
    try {
      yield exec('npm', ['owner', 'add', user, name])
      console.log(user + ' added as owner to "' + name + '"')
    } catch (err) {
      console.error(err)
      // who knows why this would happen
    }
  }
}

function exec(cmd, args, done) {
  cp.execFile(cmd, args, function (err, stdout) {
    done(err, !err && stdout.toString('utf8').trim())
  })

  return function (fn) {
    done = fn
  }
}