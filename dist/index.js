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
exports.getPullRequestByNumber = getPullRequestByNumber;
exports.validatePullRequest = validatePullRequest;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
async function run() {
    try {
        const token = core.getInput('github-token', { required: true });
        const prNumber = parseInt(core.getInput('pr-number', { required: true }), 10);
        const validLabels = core
            .getInput('valid-labels', { required: true })
            .split(',')
            .map((label) => label.trim());
        const invalidLabels = core
            .getInput('invalid-labels')
            .split(',')
            .map((label) => label.trim());
        // Log the PR number, valid and invalid labels
        core.info(`Pull request number: ${prNumber}`);
        core.info(`Valid labels are: ${JSON.stringify(validLabels)}`);
        core.info(`Invalid labels are: ${JSON.stringify(invalidLabels)}`);
        const { context } = github;
        const octokit = github.getOctokit(token);
        core.debug(`Fetching pull request details for PR number ${prNumber}`);
        const pr = await getPullRequestByNumber(octokit, context.repo.owner, context.repo.repo, prNumber);
        if (pr) {
            core.info(`Validating labels for pull request #${prNumber}`);
            await validatePullRequest(pr, validLabels, invalidLabels);
        }
        else {
            core.setFailed('Error: Pull request not found');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(`Error: ${error.message}`);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
}
// Fetch pull request details
async function getPullRequestByNumber(octokit, owner, repo, prNumber) {
    try {
        const { data: pr } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber,
        });
        return pr;
    }
    catch (error) {
        core.error(`Error fetching pull request #${prNumber}: ${error}`);
        return undefined;
    }
}
// Validate pull request labels
async function validatePullRequest(pr, validLabels, invalidLabels) {
    const prLabels = pr.labels.map((label) => label.name);
    const prValidLabels = prLabels.filter((label) => validLabels.includes(label));
    const prInvalidLabels = prLabels.filter((label) => invalidLabels.includes(label));
    // Log invalid labels
    if (prInvalidLabels.length > 0) {
        core.setFailed(`Invalid labels found: ${prInvalidLabels.join(', ')}`);
    }
    else {
        core.info(`No invalid labels found`);
    }
    // Log valid labels
    if (prValidLabels.length > 0) {
        core.info(`Valid labels found: ${JSON.stringify(prValidLabels)}`);
    }
    else {
        core.setFailed(`No valid labels found. Expected one of: ${validLabels.join(', ')}`);
    }
    if (prInvalidLabels.length === 0 && prValidLabels.length > 0) {
        core.info('Labels from this PR match the expected labels');
    }
}
if (!process.env.JEST_WORKER_ID) {
    run();
}
