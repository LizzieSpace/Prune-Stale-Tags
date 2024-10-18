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
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRefs = matchRefs;
const github = __importStar(require("@actions/github"));
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
async function matchRefs(pattern, repository_owner, repository_name, token, retention, delete_releases = false, delete_tags = false, dry_run = false) {
    const octokit = github.getOctokit(token);
    const { data: refs } = await octokit.rest.git.listMatchingRefs({
        owner: repository_owner,
        repo: repository_name,
        ref: 'tags/'
    });
    const matched = [];
    const matchPromises = refs.map(async (data) => {
        const ref = data.ref.substring(10);
        if (pattern.test(ref)) {
            const { data: tag } = await octokit.rest.git.getTag({
                owner: repository_owner,
                repo: repository_name,
                tag_sha: data.object.sha
            });
            matched.push(tag);
        }
    });
    await Promise.all(matchPromises);
    const pruned_tags = new Map(), removed_releases = new Map(), kept_tags = new Map();
    if (delete_tags || delete_releases) {
        matched.slice(0, retention).map(tag => kept_tags.set(tag.tag, tag));
        const deletionPromises = matched
            .sort((a, b) => {
            const aDate = new Date(a.tagger.date);
            const bDate = new Date(b.tagger.date);
            return aDate.getTime() - bDate.getTime();
        })
            .slice(retention)
            .map(async (tag) => {
            const { data: release } = await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
                owner: repository_owner,
                repo: repository_name,
                tag: tag.tag,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            if (dry_run) {
                removed_releases.set(release.tag_name, release);
                pruned_tags.set(tag.tag, tag);
                return;
            }
            await octokit
                .request('DELETE /repos/DELETE /repos/{owner}/{repo}/releases/{release_id}', {
                owner: repository_owner,
                repo: repository_name,
                release_id: release.id,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
                .then(() => removed_releases.set(release.tag_name, release));
            if (delete_tags) {
                await octokit.rest.git
                    .deleteRef({
                    owner: repository_owner,
                    repo: repository_name,
                    ref: `tags/${tag.tag}`
                })
                    .then(() => pruned_tags.set(tag.tag, tag));
            }
        });
        await Promise.all(deletionPromises);
    }
    return {
        kept_tags: kept_tags,
        pruned_tags: pruned_tags,
        removed_releases: removed_releases
    };
}
//# sourceMappingURL=refs.js.map