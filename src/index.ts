import * as core from '@actions/core'
import * as github from '@actions/github'
import { RestEndpointMethodTypes } from '@octokit/rest'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']

export async function run(): Promise<void> {
  try {
    const token = core.getInput('repo-token')
    const prNumber = parseInt(core.getInput('pr-number'), 10)
    const validLabels = core
      .getInput('valid-labels', { required: true })
      .split(',')
      .map((label) => label.trim())
    const invalidLabels = core
      .getInput('invalid-labels')
      .split(',')
      .map((label) => label.trim())

    // Log the PR number, valid and invalid labels
    core.info(`Pull request number: ${prNumber}`)
    core.info(`Valid labels are: ${JSON.stringify(validLabels)}`)
    core.info(`Invalid labels are: ${JSON.stringify(invalidLabels)}`)

    const { context } = github
    const octokit = github.getOctokit(token)

    core.debug(`Fetching pull request details for PR number ${prNumber}`)
    const pr = await getPullRequestByNumber(
      octokit,
      context.repo.owner,
      context.repo.repo,
      prNumber,
    )

    if (pr) {
      core.info(`Validating labels for pull request #${prNumber}`)
      await validatePullRequest(pr, validLabels, invalidLabels)
    } else {
      core.setFailed('Error: Pull request not found')
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error: ${error.message}`)
    } else {
      core.setFailed('An unknown error occurred')
    }
  }
}

// Fetch pull request details
export async function getPullRequestByNumber(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PullRequest | undefined> {
  try {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    })
    return pr
  } catch (error) {
    core.error(`Error fetching pull request #${prNumber}: ${error}`)
    return undefined
  }
}

// Validate pull request labels
export async function validatePullRequest(
  pr: PullRequest,
  validLabels: string[],
  invalidLabels: string[],
): Promise<void> {
  const prLabels = pr.labels.map((label) => label.name)
  const prValidLabels = prLabels.filter((label) => validLabels.includes(label))
  const prInvalidLabels = prLabels.filter((label) =>
    invalidLabels.includes(label),
  )

  // Log invalid labels
  if (prInvalidLabels.length > 0) {
    core.setFailed(`Invalid labels found: ${prInvalidLabels.join(', ')}`)
  } else {
    core.info(`No invalid labels found`)
  }

  // Log valid labels
  if (prValidLabels.length > 0) {
    core.info(`Valid labels found: ${JSON.stringify(prValidLabels)}`)
  } else {
    core.setFailed(
      `No valid labels found. Expected one of: ${validLabels.join(', ')}`,
    )
  }

  if (prInvalidLabels.length === 0 && prValidLabels.length > 0) {
    core.info('Labels from this PR match the expected labels')
  }
}

if (!process.env.JEST_WORKER_ID) {
  run()
}
