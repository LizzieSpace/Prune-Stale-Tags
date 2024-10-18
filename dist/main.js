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
exports.run = run;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const refs_1 = require("./refs");
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
    try {
        const pattern = new RegExp(core.getInput('match-pattern', { required: true, trimWhitespace: false }));
        const retention = parseInt(core.getInput('retention'));
        const prune_tags = core.getBooleanInput('match-pattern');
        const rm_releases = core.getBooleanInput('rm-releases');
        const dry_run = core.getBooleanInput('dry_run');
        let repo_name = core.getInput('repo-name');
        let repo_owner = core.getInput('repo-owner');
        const token = core.getInput('token');
        core.setSecret(token);
        if (isNaN(retention)) {
            throw new TypeError('Not a number');
        }
        repo_name = repo_name == '' ? github.context.repo.repo : repo_name;
        repo_owner = repo_owner == '' ? github.context.repo.owner : repo_owner;
        let matched_refs = await (0, refs_1.matchRefs)(pattern, repo_owner, repo_name, token, retention, rm_releases, prune_tags, dry_run);
        // Log the current timestamp, refs, then log the new timestamp
        core.debug(new Date().toTimeString());
        // Set outputs for other workflow steps to use
        core.setOutput('pruned-tags', JSON.stringify(matched_refs));
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
//# sourceMappingURL=main.js.map