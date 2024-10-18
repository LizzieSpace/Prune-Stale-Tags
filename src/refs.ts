import * as github from '@actions/github'

/**
 * Searches repository for tags matching the given pattern.
 * @returns {Promise<Array<Object>>} Resolves with 'done!' after the refs is over.
 * @param pattern Search pattern to match tags against
 * @param repository_owner
 * @param repository_name
 * @param token the repo PAT or GITHUB_TOKEN
 * @param retention Number of tags to keep from latest tags.
 * @param delete_releases Whether to delete releases.
 * @param delete_tags Whether to delete tags. Will also remove releases.
 * @param dry_run Runs action as inconsequential
 */
export async function matchRefs(
  pattern: RegExp,
  repository_owner: string,
  repository_name: string,
  token: string,
  retention: number,
  delete_releases: boolean = false,
  delete_tags: boolean = false,
  dry_run: boolean = false
): Promise<Array<Object>> {
  let octokit = github.getOctokit(token)
  let { data: refs } = await octokit.rest.git.listMatchingRefs({
    owner: repository_owner,
    repo: repository_name,
    ref: 'tags/'
  })
  let matched = Array()
  const matchPromises = refs.map(async data => {
    let ref = data.ref.substring(10)
    if (pattern.test(ref)) {
      let { data: tag } = await octokit.rest.git.getTag({
        owner: repository_owner,
        repo: repository_name,
        tag_sha: data.object.sha
      })
      matched.push(tag)
    }
  })

  await Promise.all(matchPromises)

  if (delete_tags || delete_releases) {
    const deletionPromises = matched
      .sort((a, b) => a.tagger.date.getTime() - b.tagger.date.getTime())
      .slice(retention)
      .map(async ([tag, _]) => {
        if (dry_run) return

        let { data: release } = await octokit.request(
          'GET /repos/{owner}/{repo}/releases/tags/{tag}',
          {
            owner: repository_owner,
            repo: repository_name,
            tag: tag.tag,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          }
        )
        await octokit.request(
          'DELETE /repos/DELETE /repos/{owner}/{repo}/releases/{release_id}',
          {
            owner: repository_owner,
            repo: repository_name,
            release_id: release.id,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          }
        )
        if (delete_tags) {
          await octokit.rest.git.deleteRef({
            owner: repository_owner,
            repo: repository_name,
            ref: `tags/${tag.tag}`
          })
        }
      })

    await Promise.all(deletionPromises)
  }

  return matched
}
