import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { randomInt } from 'crypto'

export function* semverGenerator(
  major: number,
  minor: number,
  patch: number,
  preTag: string
): Generator<string> {
  const inRange = (n: number, min: number, max: number): boolean => {
    return (n - min) * (n - max) <= 0
  }
  let pre = 0
  let bump
  while (true) {
    bump = randomInt(100)
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

export function genRef(
  version: string,
  repo_owner: string,
  repo_name: string
): {
  ref: string
  node_id: `${string}-${string}-${string}-${string}-${string}`
  url: string
  object: {
    type: string
    sha: string
    url: string
  }
} {
  const tagSha: string = createHash('sha256').update(version).digest('hex')
  return {
    ref: `refs/tags/${version}`,
    node_id: randomUUID(),
    url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/refs/tags/${version}`,
    object: {
      type: 'commit',
      sha: `${tagSha}`,
      url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/commits/${tagSha}`
    }
  }
}

export function genTag(
  version: string,
  repo_owner: string,
  repo_name: string,
  date: Date
): {
  message: string
  node_id: `${string}-${string}-${string}-${string}-${string}`
  object: { sha: string; type: string; url: string }
  sha: string
  tag: string
  tagger: { date: string; email: string; name: string }
  url: string
  verification: {
    payload: null
    reason: string
    signature: null
    verified: boolean
  }
} {
  const tagSha: string = createHash('sha256').update(version).digest('hex')
  const commitSha: string = createHash('sha256')
    .update(version + date.toISOString())
    .digest('hex')
  return {
    node_id: randomUUID(), //not actually how ids are but this is just for template testing
    tag: version,
    sha: tagSha,
    url: `https://api.github.com/repos/${repo_owner}/${repo_name}/git/tags/${tagSha}`,
    message: `random message yay ${randomBytes(20).toString('hex')}`,
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

export function genRelease(
  version: string,
  repo_owner: string,
  repo_name: string,
  id: number,
  date: Date
): {
  assets: {
    browser_download_url: string
    content_type: string
    created_at: string
    download_count: number
    id: number
    label: string
    name: string
    node_id: `${string}-${string}-${string}-${string}-${string}`
    size: number
    state: string
    updated_at: string
    uploader: {
      avatar_url: string
      events_url: string
      followers_url: string
      following_url: string
      gists_url: string
      gravatar_id: string
      html_url: string
      id: number
      login: string
      node_id: string
      organizations_url: string
      received_events_url: string
      repos_url: string
      site_admin: boolean
      starred_url: string
      subscriptions_url: string
      type: string
      url: string
    }
    url: string
  }[]
  assets_url: string
  author: {
    avatar_url: string
    events_url: string
    followers_url: string
    following_url: string
    gists_url: string
    gravatar_id: string
    html_url: string
    id: number
    login: string
    node_id: string
    organizations_url: string
    received_events_url: string
    repos_url: string
    site_admin: boolean
    starred_url: string
    subscriptions_url: string
    type: string
    url: string
  }
  body: string
  created_at: string
  discussion_url: string
  draft: boolean
  html_url: string
  id: number
  name: string
  node_id: `${string}-${string}-${string}-${string}-${string}`
  prerelease: boolean
  published_at: string
  tag_name: string
  tarball_url: string
  target_commitish: string
  upload_url: string
  url: string
  zipball_url: string
} {
  const authorUUID = randomUUID()
  return {
    url: `https://api.github.com/repos/octocat/Hello-World/releases/${id}`,
    html_url: `https://github.com/${repo_owner}/${repo_name}/releases/${version}`,
    assets_url: `https://api.github.com/repos/${repo_owner}/${repo_name}/releases/${id}/assets`,
    upload_url: `https://uploads.github.com/repos/${repo_owner}/${repo_name}/releases/${id}/assets{?name,label}`,
    tarball_url: `https://api.github.com/repos/${repo_owner}/${repo_name}/tarball/${version}`,
    zipball_url: `https://api.github.com/repos/${repo_owner}/${repo_name}/zipball/${version}`,
    discussion_url: `https://github.com/${repo_owner}/${repo_name}/discussions/${id}`,
    id: id,
    node_id: randomUUID(), //not actually how ids are but this is just for template testing
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
        node_id: randomUUID(),
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
