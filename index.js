var co = require('co')
var get = require('get-json-plz')
var cp = require('child_process')

module.exports = execute

if (!module.parent) {
  // i don't know how to do --harmony in a binary
  var org = process.argv[2]
  var user = process.argv[3]
  if (!org || !user)
    throw new Error('uhhh need org and user')
  console.log('organization set as: ' + org)
  console.log('user set as: ' + user)
  co(execute(org, user))(function (err) {
    if (err)
      throw err

    process.exit()
  })
}

function* execute(org, user) {
  var me = yield exec('npm', ['whoami'])
  if (!me)
    throw new Error('log in to npm, man!')

  console.log('i am: ' + me)

  var repos = yield* getRepos(org)
  if (!repos.length)
    return

  for (var i = 0; i < repos.length; i++) {
    var repo = repos[i]
    var name = yield* getPackageName(org, repo.name)

    if (!name)
      continue

    console.log('attempting package: ' + name)

    yield* addOwner(name, me, user)
  }

  console.log('you successfully shared your developer life blood to another')
}

function* getRepos(org) {
  return yield get('https://api.github.com/orgs/' + org + '/repos')
}

function* getPackageName(org, repo) {
  var json
  try {
    var json = yield get('https://raw.github.com/' + org + '/' + repo + '/master/package.json')
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
    var owners = yield exec('npm', ['owner', 'ls', name])
  } catch (err) {
    console.log('repo "' + name + '" isnt published on npm')
    return
  }
  // you don't have rights!
  if (!~owners.indexOf(me))
    return console.log('you dont have publishing rights to "' + name + '"')
  // this particular individual already has rights!
  if (~owners.indexOf(user))
    return console.log('user already has the rights to "' + name + '"')
  try {
    yield exec('npm', ['owner', 'add', user, name])
    console.log('user added as owner to "' + name + '"')
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