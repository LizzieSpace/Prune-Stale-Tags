import * as core from '@actions/core'
import * as github from '@actions/github'
import { processRefs } from './refs'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const pattern = new RegExp(
      core.getInput('pattern', { required: true, trimWhitespace: false })
    )
    const retention: number = parseInt(
      core.getInput('retention', { required: true })
    )

    const rm_tags: boolean = core.getBooleanInput('rm-tags')
    const rm_releases: boolean = core.getBooleanInput('rm-releases')
    const dry_run: boolean = core.getBooleanInput('dry_run')

    const token: string = core.getInput('token')

    let repo_owner: string
    let repo_name: string
    ;[repo_owner, repo_name] = core.getInput('repository').split('/')

    core.setSecret(token)

    if (isNaN(retention)) {
      core.setFailed(`retention input is Not a number`)
    }

    // if repository name is null (or an empty string) set context. else, set input
    repo_name = repo_name ? repo_name : github.context.repo.repo
    repo_owner = repo_owner ? repo_owner : github.context.repo.owner

    let matchStartDate: Date
    let matchEndDate: Date
    core.debug(
      `matching refs... started at: ${((matchStartDate = new Date()), matchStartDate.toISOString())}`
    )
    const matched_refs = await processRefs(
      pattern,
      repo_owner,
      repo_name,
      token,
      retention,
      rm_releases,
      rm_tags,
      dry_run
    )
    core.debug(
      `finished after ${((matchEndDate = new Date()), matchEndDate.getTime() - matchStartDate.getTime())} ms`
    )

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
