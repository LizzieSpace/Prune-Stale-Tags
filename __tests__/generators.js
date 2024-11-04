'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.semverGenerator = semverGenerator
exports.genRef = genRef
exports.genTag = genTag
exports.genRelease = genRelease
const node_crypto_1 = require('node:crypto')
const crypto_1 = require('crypto')
function* semverGenerator(major, minor, patch, preTag) {
  const inRange = (n, min, max) => {
    return (n - min) * (n - max) <= 0
  }
  let pre = 0
  let bump
  while (true) {
    bump = (0, crypto_1.randomInt)(100)
    switch (true) {
      case inRange(bump, 0, 40): {
        pre += 1
        break
      }
      case inRange(bump, 40, 65): {
        pre = 0
        patch += 1
        break
      }
      case inRange(bump, 65, 85): {
        pre = 0
        patch = 0
        minor += 1
        break
      }
      case inRange(bump, 85, 99): {
        pre = 0
        patch = 0
        minor = 0
        major += 1
        break
      }
    }
    yield `v${major}.${minor}.${patch}` + (pre == 0 ? '' : `-${preTag}.${pre}`)
  }
}
function genRef(version, repo_owner, repo_name) {
  const tagSha = (0, node_crypto_1.createHash)('sha256')
    .update(version)
    .digest('hex')
  return {
    ref: `refs/tags/${version}`,
    node_id: (0, node_crypto_1.randomUUID)(),
    url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/refs/tags/${version}`,
    object: {
      type: 'commit',
      sha: `${tagSha}`,
      url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/commits/${tagSha}`
    }
  }
}
function genTag(version, repo_owner, repo_name, date) {
  const tagSha = (0, node_crypto_1.createHash)('sha256')
    .update(version)
    .digest('hex')
  const commitSha = (0, node_crypto_1.createHash)('sha256')
    .update(version + date.toISOString())
    .digest('hex')
  return {
    node_id: (0, node_crypto_1.randomUUID)(), //not actually how ids are but this is just for template testing
    tag: version,
    sha: tagSha,
    url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/tags/${tagSha}`,
    message: `random message yay ${(0, node_crypto_1.randomBytes)(20).toString('hex')}`,
    tagger: {
      name: `Monalisa ${repo_owner}`,
      email: `${repo_owner}@github.com`,
      date: date.toISOString()
    },
    object: {
      type: 'commit',
      sha: commitSha,
      url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/commits/${commitSha}`
    },
    verification: {
      verified: false,
      reason: 'unsigned',
      signature: null,
      payload: null
    }
  }
}
function genRelease(version, repo_owner, repo_name, id, date) {
  const authorUUID = (0, node_crypto_1.randomUUID)()
  return {
    url: `https://api.github.com/repos/octocat/Hello-World/releases/${id}`,
    html_url: `https://github.com/${repo_owner}/${repo_name}/releases/${version}`,
    assets_url: `https://api.github.com/repos/${repo_owner}/${repo_name}/releases/${id}/assets`,
    upload_url: `https://uploads.github.com/repos/${repo_owner}/${repo_name}/releases/${id}/assets{?name,label}`,
    tarball_url: `https://api.github.com/repos/${repo_owner}/${repo_name}/tarball/${version}`,
    zipball_url: `https://api.github.com/repos/${repo_owner}/${repo_name}/zipball/${version}`,
    discussion_url: `https://github.com/${repo_owner}/${repo_name}/discussions/${id}`,
    id: id,
    node_id: (0, node_crypto_1.randomUUID)(), //not actually how ids are but this is just for template testing
    tag_name: version,
    target_commitish: 'master',
    name: version,
    body: 'Description of the release',
    draft: false,
    prerelease: false,
    created_at: date.toISOString(),
    published_at: date.toISOString(),
    author: {
      login: repo_owner,
      id: 1,
      node_id: authorUUID,
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      gravatar_id: '',
      url: 'https://api.github.com/users/octocat',
      html_url: `https://github.com/${repo_owner}`,
      followers_url: `https://api.github.com/users/${repo_owner}/followers`,
      following_url: `https://api.github.com/users/${repo_owner}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${repo_owner}/gists{/gist_id}`,
      starred_url: `https://api.github.com/users/${repo_owner}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${repo_owner}/subscriptions`,
      organizations_url: `https://api.github.com/users/${repo_owner}/orgs`,
      repos_url: `https://api.github.com/users/${repo_owner}/repos`,
      events_url: `https://api.github.com/users/${repo_owner}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${repo_owner}/received_events`,
      type: 'User',
      site_admin: false
    },
    assets: [
      {
        url: `https://api.github.com/repos/${repo_owner}/${repo_name}/releases/assets/${id}`,
        browser_download_url: `https://github.com/${repo_owner}/${repo_name}/releases/download/${version}/example.zip`,
        id: id,
        node_id: (0, node_crypto_1.randomUUID)(),
        name: 'example.zip',
        label: 'short description',
        state: 'uploaded',
        content_type: 'application/zip',
        size: 1024,
        download_count: 42,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
        uploader: {
          login: repo_owner,
          id: 1,
          node_id: authorUUID,
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          gravatar_id: '',
          url: `https://api.github.com/users/${repo_owner}`,
          html_url: `https://github.com/${repo_owner}`,
          followers_url: `https://api.github.com/users/${repo_owner}/followers`,
          following_url: `https://api.github.com/users/${repo_owner}/following{/other_user}`,
          gists_url: `https://api.github.com/users/${repo_owner}/gists{/gist_id}`,
          starred_url: `https://api.github.com/users/${repo_owner}/starred{/owner}{/repo}`,
          subscriptions_url: `https://api.github.com/users/${repo_owner}/subscriptions`,
          organizations_url: `https://api.github.com/users/${repo_owner}/orgs`,
          repos_url: `https://api.github.com/users/${repo_owner}/repos`,
          events_url: `https://api.github.com/users/${repo_owner}/events{/privacy}`,
          received_events_url: `https://api.github.com/users/${repo_owner}/received_events`,
          type: 'User',
          site_admin: false
        }
      }
    ]
  }
}
//# sourceMappingURL=generators.js.map
