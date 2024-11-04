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
        const pattern = new RegExp(core.getInput('pattern', { required: true, trimWhitespace: false }));
        const retention = parseInt(core.getInput('retention', { required: true }));
        const rm_tags = core.getBooleanInput('rm-tags');
        const rm_releases = core.getBooleanInput('rm-releases');
        const dry_run = core.getBooleanInput('dry_run');
        const token = core.getInput('token');
        let repo_owner;
        let repo_name;
        [repo_owner, repo_name] = core.getInput('repository').split('/');
        core.setSecret(token);
        if (isNaN(retention)) {
            core.setFailed(`retention input is Not a number`);
        }
        // if repository name is null (or an empty string) set context. else, set input
        repo_name = repo_name ? repo_name : github.context.repo.repo;
        repo_owner = repo_owner ? repo_owner : github.context.repo.owner;
        let matchStartDate;
        let matchEndDate;
        core.debug(`matching refs... started at: ${((matchStartDate = new Date()), matchStartDate.toISOString())}`);
        const matched_refs = await (0, refs_1.processRefs)(pattern, repo_owner, repo_name, token, retention, rm_releases, rm_tags, dry_run);
        core.debug(`finished after ${((matchEndDate = new Date()), matchEndDate.getTime() - matchStartDate.getTime())} ms`);
        // Set outputs for other workflow steps to use
        core.setOutput('pruned-tags', JSON.stringify(Object.fromEntries(matched_refs.pruned_tags)));
        core.setOutput('removed-releases', JSON.stringify(Object.fromEntries(matched_refs.removed_releases)));
        core.setOutput('kept-tags', JSON.stringify(Object.fromEntries(matched_refs.kept_tags)));
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
//# sourceMappingURL=main.js.map