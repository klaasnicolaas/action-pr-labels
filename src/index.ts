import * as core from '@actions/core'
import * as github from '@actions/github'
import { RestEndpointMethodTypes } from '@octokit/rest'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']

async function run(): Promise<void> {
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

    const { context } = github

    if (context.eventName === 'pull_request_target') {
      prNumber = parseInt(core.getInput('pr-number', { required: true }), 10)
    } else if (context.eventName === 'pull_request') {
      const prNumberInput = core.getInput('pr-number', { required: false })
      prNumber = prNumberInput ? parseInt(prNumberInput, 10) : undefined
    }

    if (!prNumber && context.eventName === 'pull_request_target') {
      core.setFailed('pr-number is required for pull_request_target events')
      return
    }

    const octokit = github.getOctokit(token)
    const pr = await getPullRequestByNumber(
      octokit,
      context.repo.owner,
      context.repo.repo,
      prNumber,
    )

    if (pr) {
      await validatePullRequest(pr, validLabels, invalidLabels)
    } else {
      core.setFailed('Pull request not found')
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occurred')
    }
  }
}

async function getPullRequestByNumber(
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
    core.error(`Error fetching pull request by number: ${error}`)
    return undefined
  }
}

async function validatePullRequest(
  pr: PullRequest,
  validLabels: string[],
  invalidLabels: string[],
): Promise<void> {
  const prLabels = pr.labels.map((label) => label.name)
  const prValidLabels = prLabels.filter((label) => validLabels.includes(label))
  const prInvalidLabels = prLabels.filter((label) =>
    invalidLabels.includes(label),
  )

  if (prInvalidLabels.length > 0) {
    core.setFailed(
      `This pull request contains invalid labels: ${prInvalidLabels.join(', ')}`,
    )
  } else if (prValidLabels.length === 0) {
    core.setFailed(
      `This pull request does not contain any valid labels: ${validLabels.join(', ')}`,
    )
  } else {
    core.info('All labels are OK in this pull request')
  }
}

run()
