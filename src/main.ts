import * as core from '@actions/core'
import * as github from '@actions/github'
import { matchRefs } from './refs'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const pattern: RegExp = new RegExp(
      core.getInput('match-pattern', { required: true, trimWhitespace: false })
    )
    const retention: number = parseInt(core.getInput('retention'))

    const rm_tags: boolean = core.getBooleanInput('rm-tags')
    const rm_releases: boolean = core.getBooleanInput('rm-releases')
    const dry_run: boolean = core.getBooleanInput('dry_run')

    let repo_name: string = core.getInput('repo-name')
    let repo_owner: string = core.getInput('repo-owner')
    const token: string = core.getInput('token')

    core.setSecret(token)

    if (isNaN(retention)) {
      throw new TypeError('Not a number')
    }
    repo_name = repo_name == '' ? github.context.repo.repo : repo_name
    repo_owner = repo_owner == '' ? github.context.repo.owner : repo_owner

    let matched_refs = await matchRefs(
      pattern,
      repo_owner,
      repo_name,
      token,
      retention,
      rm_releases,
      rm_tags,
      dry_run
    )

    // Log the current timestamp, refs, then log the new timestamp
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput(
      'pruned-tags',
      JSON.stringify(Object.fromEntries(matched_refs.pruned_tags))
    )
    core.setOutput(
      'removed-releases',
      JSON.stringify(Object.fromEntries(matched_refs.removed_releases))
    )
    core.setOutput(
      'kept-tags',
      JSON.stringify(Object.fromEntries(matched_refs.kept_tags))
    )
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
