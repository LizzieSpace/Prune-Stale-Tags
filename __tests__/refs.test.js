"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Unit tests for src/refs.ts
 */
require("jest-extended");
require("lodash.product");
const lodash_1 = __importDefault(require("lodash"));
const github = __importStar(require("@actions/github"));
const refs = __importStar(require("../src/refs"));
const refs_1 = require("../src/refs");
const globals_1 = require("@jest/globals");
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
const { genRef, genRelease, genTag, semverGenerator } = require('./generators');
const crypto_1 = require("crypto");
const processRefsMock = jest.spyOn(refs, 'processRefs');
const mockRequest = jest.fn();
const mockRequestTag = jest.fn();
const mockRequestDel = jest.fn();
const mockListMatchingRefs = jest.fn();
const mockGetTag = jest.fn();
const mockDeleteRef = jest.fn();
let mockGetOctokit;
const mockOctokit = {
    rest: {
        git: {
            listMatchingRefs: mockListMatchingRefs,
            getTag: mockGetTag,
            deleteRef: mockDeleteRef
        }
    },
    request: mockRequest
};
let versions = [];
let matchedVersions = [];
let expectedMatchedLen;
const pattern = /-beta\./;
const repo_owner = 'OWNER';
const repo_name = 'REPO';
const token = 'token';
const retention = 2;
describe.each(Array(10).fill(null))('refs.ts (stress test #%#)', () => {
    (0, globals_1.beforeAll)(() => { });
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetOctokit = jest.spyOn(github, 'getOctokit');
        let id = 1;
        let date = new Date('2023-02-27T19:35:32Z');
        versions = [];
        matchedVersions = [];
        const version = semverGenerator(0, 1, 0, 'beta');
        for (let i = 0; i < 15; i++) {
            const ver = version.next().value;
            if (ver.includes('-beta.'))
                matchedVersions.push(ver);
            versions.push(ver);
        }
        expectedMatchedLen =
            matchedVersions.length >= retention
                ? matchedVersions.length - retention
                : 0;
        mockGetOctokit.mockReturnValue(mockOctokit);
        mockDeleteRef.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ owner: repository_owner, repo: repository_name, ref: ref }) => {
            const refs = [];
            for (const ver of versions) {
                refs.push(genRef(ver, repository_owner, repository_name));
            }
            return Promise.resolve(refs);
        });
        mockListMatchingRefs.mockImplementationOnce(async ({ owner: repository_owner, repo: repository_name, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ref: ref }) => {
            const response = [];
            for (const v of versions) {
                response.push(genRef(v, repository_owner, repository_name));
            }
            return Promise.resolve({ data: response });
        });
        const matchedTags = matchedVersions.values();
        mockGetTag.mockImplementation(async ({ owner: repository_owner, repo: repository_name, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tag_sha: tag_sha }) => {
            date = new Date(date.getTime() + (0, crypto_1.randomInt)(10000));
            return Promise.resolve({
                data: genTag(matchedTags.next().value, repository_owner, repository_name, date)
            });
        });
        mockRequestDel.mockImplementation(async () => Promise.resolve());
        mockRequestTag.mockImplementation(async (owner, repo, tag) => {
            const response = genRelease(tag, owner, repo, id++, date);
            return Promise.resolve({ data: response });
        });
        mockRequest.mockImplementation(async (call, metadata) => {
            switch (call) {
                case 'GET /repos/{owner}/{repo}/releases/tags/{tag}': {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { owner, repo, tag, _ } = metadata;
                    return mockRequestTag(owner, repo, tag);
                }
                case 'DELETE /repos/DELETE /repos/{owner}/{repo}/releases/{release_id}': {
                    return mockRequestDel();
                }
            }
        });
    });
    describe.each(lodash_1.default.product([true, false], //dry_run
    [true, false], //del_tags
    [true, false] //del_releases
    ))('bool args', (dry_run, del_tags, del_releases) => {
        let description;
        switch (true) {
            case dry_run:
                description = `should dry run (del_tags:${del_tags}, del_releases:${del_releases})`;
                break;
            case del_tags:
                description = `should del tags and releases (del_releases:${del_releases})`;
                break;
            case del_releases && !del_tags:
                description = 'should del only releases';
                break;
            case !del_releases && !del_tags && !dry_run:
                description = 'should run successfully (all bool args false)';
                break;
            default:
                description = 'should run successfully';
        }
        // eslint-disable-next-line jest/valid-title
        it(description, async () => {
            const { kept_tags, pruned_tags, removed_releases } = await (0, refs_1.processRefs)(pattern, repo_owner, repo_name, token, retention, del_releases, del_tags, dry_run);
            (0, globals_1.expect)(processRefsMock).toHaveBeenCalled();
            (0, globals_1.expect)(mockListMatchingRefs).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(mockRequestTag).toHaveBeenCalledTimes(del_releases || del_tags ? expectedMatchedLen : 0);
            (0, globals_1.expect)(mockRequestDel).toHaveBeenCalledTimes((del_releases || del_tags) && !dry_run ? expectedMatchedLen : 0);
            (0, globals_1.expect)(mockDeleteRef).toHaveBeenCalledTimes(del_tags && !dry_run ? expectedMatchedLen : 0);
            (0, globals_1.expect)(kept_tags.size).toBeLessThanOrEqual(retention);
            (0, globals_1.expect)(removed_releases.size).toBe(del_releases || del_tags ? expectedMatchedLen : 0);
            (0, globals_1.expect)(pruned_tags.size).toBe(del_tags ? expectedMatchedLen : 0);
            (0, globals_1.expect)(kept_tags).toBeInstanceOf(Map);
            (0, globals_1.expect)(pruned_tags).toBeInstanceOf(Map);
            (0, globals_1.expect)(removed_releases).toBeInstanceOf(Map);
        });
    });
    it('should run even when bool args unspecified', async () => {
        await (0, refs_1.processRefs)(pattern, repo_owner, repo_name, token, retention);
        (0, globals_1.expect)(processRefsMock).toHaveBeenCalled();
        (0, globals_1.expect)(mockListMatchingRefs).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(mockRequestTag).not.toHaveBeenCalled();
        (0, globals_1.expect)(mockRequestDel).not.toHaveBeenCalled();
        (0, globals_1.expect)(mockDeleteRef).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=refs.test.js.map