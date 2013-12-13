var co = require('co')
var cp = require('child_process')
var get = require('get-json-plz')
var archan = require('archan')

module.exports = execute

function* execute(org, user, options) {
  console.log('organization: ' + org)
  console.log('user: ' + user)

  var me = yield exec('npm', ['whoami'])
  if (!me)
    throw new Error('log in to npm, man!')

  console.log('me: ' + me)

  var repos = yield* getRepos(org)
  if (!repos.length)
    return console.log('no repos to check')

  options = options || {}
  options.concurrency = options.concurrency || 1
  var ch = archan(options)

  for (var i = 0; i < repos.length; i++) {
    yield* ch.drain()
    co(function* () {
      var repo = repos[i]
      var name = yield* getPackageName(org, repo.name)
      if (name)
        yield* addOwner(name, me, user)
    })(ch.push())
  }

  yield* ch.flush()
  console.log('you have successfully shared your developer life blood with another')
}

function* getRepos(org) {
  return yield get('https://api.github.com/orgs/' + org + '/repos')
}

function* getPackageName(org, repo) {
  var json
  try {
    json = yield get('https://raw.github.com/' + org + '/' + repo + '/master/package.json')
  } catch (err) {}
  // no package.json
  if (!json)
    return console.log('"' + repo + '" has no package.json')
  if (json.private)
    return console.log('"' + repo + '" is private')
  return json.name
}

function* addOwner(name, me, user) {
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

function exec(cmd, args, done) {
  cp.execFile(cmd, args, function (err, stdout) {
    done(err, !err && stdout.toString('utf8').trim())
  })

  return function (fn) {
    done = fn
  }
}