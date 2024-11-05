/**
 * Unit tests for src/refs.ts
 */
import 'jest-extended'
import 'lodash.product'
import _ from 'lodash'

import * as github from '@actions/github'
import * as refs from '../src/refs'
import { processRefs } from '../src/refs'
import { beforeAll, expect } from '@jest/globals'
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
const { genRef, genRelease, genTag, semverGenerator } = require('./generators')
import { randomInt } from 'crypto'

const processRefsMock = jest.spyOn(refs, 'processRefs')

const mockRequest = jest.fn()
const mockRequestTag = jest.fn()
const mockRequestDel = jest.fn()
const mockListMatchingRefs = jest.fn()
const mockGetTag = jest.fn()
const mockDeleteRef = jest.fn()
let mockGetOctokit: jest.SpyInstance
const mockOctokit = {
  rest: {
    git: {
      listMatchingRefs: mockListMatchingRefs,
      getTag: mockGetTag,
      deleteRef: mockDeleteRef
    }
  },
  request: mockRequest
}

let versions: string[] = []
let matchedVersions: string[] = []
let expectedMatchedLen: number

const pattern = /-beta\./
const repo_owner = 'OWNER'
const repo_name = 'REPO'
const token = 'token'
const retention = 2

describe.each(Array(10).fill(null))('refs.ts (stress test #%#)', () => {
  beforeAll(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetOctokit = jest.spyOn(github, 'getOctokit')

    let id = 1
    let date = new Date('2023-02-27T19:35:32Z')
    versions = []
    matchedVersions = []
    const version = semverGenerator(0, 1, 0, 'beta')
    for (let i = 0; i < 15; i++) {
      const ver = version.next().value
      if (ver.includes('-beta.')) matchedVersions.push(ver)
      versions.push(ver)
    }

    expectedMatchedLen =
      matchedVersions.length >= retention
        ? matchedVersions.length - retention
        : 0

    mockGetOctokit.mockReturnValue(mockOctokit)

    mockDeleteRef.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ owner: repository_owner, repo: repository_name, ref: ref }) => {
        const refs: {
          ref: string
          node_id: `${string}-${string}-${string}-${string}-${string}`
          url: string
          object: { type: string; sha: string; url: string }
        }[] = []
        for (const ver of versions) {
          refs.push(genRef(ver, repository_owner, repository_name))
        }
        return Promise.resolve(refs)
      }
    )

    mockListMatchingRefs.mockImplementationOnce(
      async ({
        owner: repository_owner,
        repo: repository_name,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ref: ref
      }) => {
        const response = []
        for (const v of versions) {
          response.push(genRef(v, repository_owner, repository_name))
        }
        return Promise.resolve({ data: response })
      }
    )

    const matchedTags = matchedVersions.values()
    mockGetTag.mockImplementation(
      async ({
        owner: repository_owner,
        repo: repository_name,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tag_sha: tag_sha
      }) => {
        date = new Date(date.getTime() + randomInt(10000))
        return Promise.resolve({
          data: genTag(
            matchedTags.next().value,
            repository_owner,
            repository_name,
            date
          )
        })
      }
    )

    mockRequestDel.mockImplementation(async () => Promise.resolve())
    mockRequestTag.mockImplementation(async (owner, repo, tag) => {
      const response = genRelease(tag, owner, repo, id++, date)
      return Promise.resolve({ data: response })
    })

    mockRequest.mockImplementation(async (call, metadata) => {
      switch (call) {
        case 'GET /repos/{owner}/{repo}/releases/tags/{tag}': {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { owner, repo, tag, _ } = metadata
          return mockRequestTag(owner, repo, tag)
        }
        case 'DELETE /repos/DELETE /repos/{owner}/{repo}/releases/{release_id}': {
          return mockRequestDel()
        }
      }
    })
  })

  describe.each(
    _.product(
      [true, false], //dry_run
      [true, false], //del_tags
      [true, false] //del_releases
    )
  )(
    'bool args',
    (dry_run: boolean, del_tags: boolean, del_releases: boolean) => {
      let description: string
      switch (true) {
        case dry_run:
          description = `should dry run (del_tags:${del_tags}, del_releases:${del_releases})`
          break
        case del_tags:
          description = `should del tags and releases (del_releases:${del_releases})`
          break
        case del_releases && !del_tags:
          description = 'should del only releases'
          break
        case !del_releases && !del_tags && !dry_run:
          description = 'should run successfully (all bool args false)'
          break
        default:
          description = 'should run successfully'
      }
      // eslint-disable-next-line jest/valid-title
      it(description, async () => {
        const { kept_tags, pruned_tags, removed_releases } = await processRefs(
          pattern,
          repo_owner,
          repo_name,
          token,
          retention,
          del_releases,
          del_tags,
          dry_run
        )

        expect(processRefsMock).toHaveBeenCalled()
        expect(mockListMatchingRefs).toHaveBeenCalledTimes(1)
        expect(mockRequestTag).toHaveBeenCalledTimes(
          del_releases || del_tags ? expectedMatchedLen : 0
        )
        expect(mockRequestDel).toHaveBeenCalledTimes(
          (del_releases || del_tags) && !dry_run ? expectedMatchedLen : 0
        )
        expect(mockDeleteRef).toHaveBeenCalledTimes(
          del_tags && !dry_run ? expectedMatchedLen : 0
        )

        expect(kept_tags.size).toBeLessThanOrEqual(retention)
        expect(removed_releases.size).toBe(
          del_releases || del_tags ? expectedMatchedLen : 0
        )
        expect(pruned_tags.size).toBe(del_tags ? expectedMatchedLen : 0)

        expect(kept_tags).toBeInstanceOf(Map)
        expect(pruned_tags).toBeInstanceOf(Map)
        expect(removed_releases).toBeInstanceOf(Map)
      })
    }
  )

  it('should run even when bool args unspecified', async () => {
    await processRefs(pattern, repo_owner, repo_name, token, retention)

    expect(processRefsMock).toHaveBeenCalled()
    expect(mockListMatchingRefs).toHaveBeenCalledTimes(1)
    expect(mockRequestTag).not.toHaveBeenCalled()
    expect(mockRequestDel).not.toHaveBeenCalled()
    expect(mockDeleteRef).not.toHaveBeenCalled()
  })
})
