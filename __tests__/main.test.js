'use strict'
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            }
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
Object.defineProperty(exports, '__esModule', { value: true })
/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */
require('jest-extended')
const core = __importStar(require('@actions/core'))
const github = __importStar(require('@actions/github'))
const main = __importStar(require('../src/main'))
const refs = __importStar(require('../src/refs'))
const node_crypto_1 = require('node:crypto')
// Mock the action's main function
const runMock = jest.spyOn(main, 'run')
let processRefsMock
// Mock the GitHub Actions core library
let debugMock
let errorMock
let getInputMock
let getBoolInputMock
let setFailedMock
let setOutputMock
let getRepoMock
describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    processRefsMock = jest.spyOn(refs, 'processRefs').mockImplementation()
    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    getBoolInputMock = jest.spyOn(core, 'getBooleanInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    getRepoMock = jest.spyOn(github.context, 'repo', 'get').mockReturnValue({
      repo: 'REPO',
      owner: 'OWNER'
    })
  })
  afterAll(() => {
    // Restore
    jest.restoreAllMocks()
  })
  it('sets the output', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'pattern':
          return `-beta\\.`
        case 'retention':
          return '3'
        case 'token':
          return ''
        case 'repository': //I've got to have something on owner and name here, else it fails due to context not being set
          return 'octocat/Hello-World'
        default:
          return ''
      }
    })
    getBoolInputMock.mockImplementation(name => {
      switch (name) {
        case 'rm-tags':
          return false
        case 'rm-releases':
          return true
        case 'dry_run':
          return false
        default:
          return false
      }
    })
    function genMatchOutputs() {
      const keptTagsMap = new Map()
      const prunedTagsMap = new Map()
      const removedReleasesMap = new Map()
      const versions = Array(
        'v2.0.0-beta.1',
        'v2.0.0-beta.2',
        'v2.0.0-beta.3',
        'v2.0.0-beta.4',
        'v2.0.0-beta.5'
      )
      let tagDate = new Date('2023-11-07T22:01:45Z')
      versions.forEach((version, i) => {
        const tagSha = (0, node_crypto_1.createHash)('sha256')
          .update(version)
          .digest('hex')
        const commitSha = (0, node_crypto_1.createHash)('sha256')
          .update(version + tagDate.toISOString())
          .digest('hex')
        tagDate = new Date(
          tagDate.getTime() + (0, node_crypto_1.randomInt)(10000)
        )
        const response = {
          node_id: (0, node_crypto_1.randomUUID)(), //not actually how ids are but this is just for template testing
          tag: version,
          sha: tagSha,
          url: `https://api.github.com/repos/octocat/Hello-World/git/tags/${tagSha}`,
          message: `random message yay ${(0, node_crypto_1.randomBytes)(20).toString('hex')}`,
          tagger: {
            name: 'Monalisa Octocat',
            email: 'octocat@github.com',
            date: tagDate.toISOString()
          },
          object: {
            type: 'commit',
            sha: commitSha,
            url: `https://api.github.com/repos/octocat/Hello-World/git/commits/${commitSha}`
          },
          verification: {
            verified: false,
            reason: 'unsigned',
            signature: null,
            payload: null
          }
        }
        const releaseResponse = {
          url: `https://api.github.com/repos/octocat/Hello-World/releases/${i}`,
          html_url: `https://github.com/octocat/Hello-World/releases/${version}`,
          assets_url: `https://api.github.com/repos/octocat/Hello-World/releases/${i}/assets`,
          upload_url: `https://uploads.github.com/repos/octocat/Hello-World/releases/${i}/assets{?name,label}`,
          tarball_url: `https://api.github.com/repos/octocat/Hello-World/tarball/${version}`,
          zipball_url: `https://api.github.com/repos/octocat/Hello-World/zipball/${version}`,
          discussion_url: `https://github.com/octocat/Hello-World/discussions/${i}`,
          id: i,
          node_id: (0, node_crypto_1.randomUUID)(), //not actually how ids are but this is just for template testing
          tag_name: version,
          target_commitish: 'master',
          name: version,
          body: 'Description of the release',
          draft: false,
          prerelease: false,
          created_at: tagDate.toISOString(),
          published_at: tagDate.toISOString(),
          author: {
            login: 'octocat',
            id: 1,
            node_id: 'MDQ6VXNlcjE=',
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            gravatar_id: '',
            url: 'https://api.github.com/users/octocat',
            html_url: 'https://github.com/octocat',
            followers_url: 'https://api.github.com/users/octocat/followers',
            following_url:
              'https://api.github.com/users/octocat/following{/other_user}',
            gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
            starred_url:
              'https://api.github.com/users/octocat/starred{/owner}{/repo}',
            subscriptions_url:
              'https://api.github.com/users/octocat/subscriptions',
            organizations_url: 'https://api.github.com/users/octocat/orgs',
            repos_url: 'https://api.github.com/users/octocat/repos',
            events_url: 'https://api.github.com/users/octocat/events{/privacy}',
            received_events_url:
              'https://api.github.com/users/octocat/received_events',
            type: 'User',
            site_admin: false
          },
          assets: [
            {
              url: `https://api.github.com/repos/octocat/Hello-World/releases/assets/1`,
              browser_download_url: `https://github.com/octocat/Hello-World/releases/download/${version}/example.zip`,
              id: 1,
              node_id: (0, node_crypto_1.randomUUID)(),
              name: 'example.zip',
              label: 'short description',
              state: 'uploaded',
              content_type: 'application/zip',
              size: 1024,
              download_count: 42,
              created_at: tagDate.toISOString(),
              updated_at: tagDate.toISOString(),
              uploader: {
                login: 'octocat',
                id: 1,
                node_id: 'MDQ6VXNlcjE=',
                avatar_url: 'https://github.com/images/error/octocat_happy.gif',
                gravatar_id: '',
                url: 'https://api.github.com/users/octocat',
                html_url: 'https://github.com/octocat',
                followers_url: 'https://api.github.com/users/octocat/followers',
                following_url:
                  'https://api.github.com/users/octocat/following{/other_user}',
                gists_url:
                  'https://api.github.com/users/octocat/gists{/gist_id}',
                starred_url:
                  'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                subscriptions_url:
                  'https://api.github.com/users/octocat/subscriptions',
                organizations_url: 'https://api.github.com/users/octocat/orgs',
                repos_url: 'https://api.github.com/users/octocat/repos',
                events_url:
                  'https://api.github.com/users/octocat/events{/privacy}',
                received_events_url:
                  'https://api.github.com/users/octocat/received_events',
                type: 'User',
                site_admin: false
              }
            }
          ]
        }
        if (parseInt(version.charAt(-1)) <= 2) {
          keptTagsMap.set(version, response)
        } else {
          prunedTagsMap.set(version, response)
          removedReleasesMap.set(version, releaseResponse)
        }
      })
      return {
        kept_tags: keptTagsMap,
        pruned_tags: prunedTagsMap,
        removed_releases: removedReleasesMap
      }
    }
    processRefsMock.mockResolvedValue(genMatchOutputs())
    await main.run()
    expect(runMock).toHaveReturned()
    // Verify that all the core library functions were called correctly
    expect(debugMock).toHaveBeenCalled()
    expect(debugMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(
        /matching refs\.\.\. started at: [0-9]{4}-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-6][0-9]:[0-6][0-9].[0-9]{3}Z/
      )
    ) // matches UTC ISO time format
    expect(debugMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/finished after [0-9]+ ms/)
    )
    const tagSchema = json => {
      const schema = {
        node_id: expect.any(String),
        tag: expect.any(String),
        sha: expect.any(String),
        url: expect.any(String),
        message: expect.any(String),
        tagger: {
          name: expect.any(String),
          email: expect.any(String),
          date: expect.any(String)
        },
        object: {
          type: expect.any(String),
          sha: expect.any(String),
          url: expect.any(String)
        },
        verification: {
          verified: expect.any(Boolean),
          reason: expect.any(String),
          signature: expect.toBeOneOf([expect.any(String), null]),
          payload: expect.toBeOneOf([expect.any(String), null])
        }
      }
      const values = JSON.parse(json)
      for (const tag in values)
        expect(values[tag]).toEqual(expect.objectContaining(schema))
      return true
    }
    const releaseSchema = json => {
      const schema = {
        url: expect.any(String),
        html_url: expect.any(String),
        assets_url: expect.any(String),
        upload_url: expect.any(String),
        tarball_url: expect.toBeOneOf([expect.any(String), null]),
        zipball_url: expect.toBeOneOf([expect.any(String), null]),
        id: expect.any(Number),
        node_id: expect.any(String), //not actually how ids are but this is just for template testing
        tag_name: expect.any(String),
        target_commitish: expect.any(String),
        name: expect.toBeOneOf([expect.any(String), null]),
        draft: expect.any(Boolean),
        prerelease: expect.any(Boolean),
        created_at: expect.any(String),
        published_at: expect.toBeOneOf([expect.any(String), null]),
        author: {
          login: expect.any(String),
          id: expect.any(Number),
          node_id: expect.any(String),
          avatar_url: expect.any(String),
          gravatar_id: expect.toBeOneOf([expect.any(String), null]),
          url: expect.any(String),
          html_url: expect.any(String),
          followers_url: expect.any(String),
          following_url: expect.any(String),
          gists_url: expect.any(String),
          starred_url: expect.any(String),
          subscriptions_url: expect.any(String),
          organizations_url: expect.any(String),
          repos_url: expect.any(String),
          events_url: expect.any(String),
          received_events_url: expect.any(String),
          type: expect.any(String),
          site_admin: expect.any(Boolean)
        },
        assets: [
          {
            url: expect.any(String),
            browser_download_url: expect.any(String),
            id: expect.any(Number),
            node_id: expect.any(String),
            name: expect.any(String),
            label: expect.toBeOneOf([expect.any(String), null]),
            state: expect.stringMatching(/uploaded|open/),
            content_type: expect.any(String),
            size: expect.any(Number),
            download_count: expect.any(Number),
            created_at: expect.any(String),
            updated_at: expect.any(String),
            uploader: {
              login: expect.any(String),
              id: expect.any(Number),
              node_id: expect.any(String),
              avatar_url: expect.any(String),
              gravatar_id: expect.toBeOneOf([expect.any(String), null]),
              url: expect.any(String),
              html_url: expect.any(String),
              followers_url: expect.any(String),
              following_url: expect.any(String),
              gists_url: expect.any(String),
              starred_url: expect.any(String),
              subscriptions_url: expect.any(String),
              organizations_url: expect.any(String),
              repos_url: expect.any(String),
              events_url: expect.any(String),
              received_events_url: expect.any(String),
              type: expect.any(String),
              site_admin: expect.any(Boolean)
            }
          }
        ]
      }
      const values = JSON.parse(json)
      for (const tag in values)
        expect(values[tag]).toEqual(expect.objectContaining(schema))
      return true
    }
    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'pruned-tags',
      expect.toBeOneOf([expect.toBeEmptyObject(), expect.toSatisfy(tagSchema)])
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'removed-releases',
      expect.toBeOneOf([
        expect.toBeEmptyObject(),
        expect.toSatisfy(releaseSchema)
      ])
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      3,
      'kept-tags',
      expect.toBeOneOf([expect.toBeEmptyObject(), expect.toSatisfy(tagSchema)])
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
  it('switches to context repo if input `repository` is empty', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'repository':
          return ''
        default:
          return ''
      }
    })
    await main.run()
    expect(runMock).toHaveReturned()
    expect(getRepoMock).toHaveBeenCalledTimes(2)
  })
  it('fails to parse NAN `retention` input and\n      sets a failed status. e.g: `three`', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'retention':
          return 'three'
        default:
          return ''
      }
    })
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      'retention input is Not a number'
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
  it("fails to parse `retention` input if it doesn't\n      start with a number,setting failed status. e.g: `keep 3`", async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'retention':
          return 'keep 3'
        default:
          return ''
      }
    })
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      'retention input is Not a number'
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
  it('parses `retention` input correctly\n      if starts with number. e.g: `3 tags`', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'retention':
          return '3 tags'
        default:
          return ''
      }
    })
    await main.run()
    expect(runMock).toHaveReturned()
    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).not.toHaveBeenNthCalledWith(
      1,
      'retention input is Not a number'
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
})
//# sourceMappingURL=main.test.js.map
