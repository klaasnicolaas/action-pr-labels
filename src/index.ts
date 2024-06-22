import * as core from '@actions/core'
import * as github from '@actions/github'
import { RestEndpointMethodTypes } from '@octokit/rest'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']

export async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', { required: true })
    const validLabels = core
      .getInput('valid-labels', { required: true })
      .split(',')
      .map((label) => label.trim())
    const invalidLabels = core
      .getInput('invalid-labels')
      .split(',')
      .map((label) => label.trim())
    let prNumber: number | undefined

    // Log the valid and invalid labels
    core.info(`Valid labels are: ${JSON.stringify(validLabels)}`)
    core.info(`Invalid labels are: ${JSON.stringify(invalidLabels)}`)

    const { context } = github

    if (context.eventName === 'pull_request_target') {
      prNumber = parseInt(core.getInput('pr-number', { required: true }), 10)
    } else if (context.eventName === 'pull_request') {
      const prNumberInput = core.getInput('pr-number', { required: false })
      prNumber = prNumberInput ? parseInt(prNumberInput, 10) : undefined
    }

    // Check if pr-number is required for pull_request_target events
    if (!prNumber && context.eventName === 'pull_request_target') {
      core.setFailed(
        'Error: pr-number is required for pull_request_target events',
      )
      return
    }

    core.info(`Pull request number: ${prNumber}`)

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
  prNumber: number | undefined,
): Promise<PullRequest | undefined> {
  try {
    if (prNumber === undefined) {
      throw new Error('Pull request number is undefined')
    }

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
