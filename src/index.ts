import * as core from '@actions/core'
import * as github from '@actions/github'
import type { RestEndpointMethodTypes } from '@octokit/rest'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']
type PullRequestLabel = PullRequest['labels'][number]

interface Label {
  name: string
}

export interface ValidationResult {
  isValid: boolean
  validLabels: string[]
  invalidLabels: string[]
}

/**
 * Check if a label matches a glob pattern.
 * Supports `*` as a wildcard that matches any characters.
 * Examples: "type/*" matches "type/bug", "scope-*" matches "scope-frontend"
 */
export function matchesPattern(label: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
  return new RegExp(`^${regexStr}$`).test(label)
}

function matchesAnyPattern(label: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(label, pattern))
}

export async function run(): Promise<void> {
  try {
    const token = core.getInput('repo-token', { required: true })
    const prNumber = parseInt(
      core.getInput('pr-number', { required: true }),
      10,
    )
    const validLabels = core
      .getInput('valid-labels', { required: true })
      .split(',')
      .map((label) => label.trim())
    const invalidLabels =
      core
        .getInput('invalid-labels')
        ?.split(',')
        .map((label) => label.trim())
        .filter((label) => label) || []
    const postComment = core.getInput('post-comment').toLowerCase() === 'true'

    // Log the PR number, valid and invalid labels
    core.debug(`Pull request number: ${prNumber}`)
    core.info(`Valid labels are: ${JSON.stringify(validLabels)}`)
    core.info(
      `Invalid labels are: ${invalidLabels.length > 0 ? JSON.stringify(invalidLabels) : 'None'}`,
    )

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
      const result = validatePullRequest(pr, validLabels, invalidLabels)

      // Set outputs
      core.setOutput('is-valid', result.isValid)
      core.setOutput('valid-labels-found', JSON.stringify(result.validLabels))
      core.setOutput(
        'invalid-labels-found',
        JSON.stringify(result.invalidLabels),
      )

      // Post comment if enabled
      if (postComment) {
        await postValidationComment(
          octokit,
          context.repo.owner,
          context.repo.repo,
          prNumber,
          result,
          validLabels,
        )
      }

      // Fail if not valid
      if (!result.isValid) {
        if (result.validLabels.length === 0) {
          core.setFailed(
            `No valid labels found. Expected one of: ${validLabels.join(', ')}`,
          )
        }
        if (result.invalidLabels.length > 0) {
          core.setFailed(
            `Invalid labels found: ${JSON.stringify(result.invalidLabels)}`,
          )
        }
        core.setFailed('Labels from this PR do not match the expected labels')
      } else {
        core.info('Labels from this PR match the expected labels')
      }
    } else {
      core.setFailed('Error: Pull request not found')
    }
  } catch (error) {
    core.setFailed(`Error: ${(error as Error).message}`)
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
    return pr as PullRequest
  } catch (error) {
    core.error(`Error fetching pull request #${prNumber}: ${error}`)
    return undefined
  }
}

// Validate pull request labels
export function validatePullRequest(
  pr: PullRequest,
  validLabels: string[],
  invalidLabels: string[],
): ValidationResult {
  const prLabels: Label[] = pr.labels.map((label: PullRequestLabel) => ({
    name: label.name,
  }))

  const foundValidLabels: string[] = []
  const foundInvalidLabels: string[] = []

  prLabels.forEach((label) => {
    if (matchesAnyPattern(label.name, validLabels)) {
      foundValidLabels.push(label.name)
    } else if (matchesAnyPattern(label.name, invalidLabels)) {
      foundInvalidLabels.push(label.name)
    }
  })

  if (foundValidLabels.length > 0) {
    core.info(`Valid labels found: ${JSON.stringify(foundValidLabels)}`)
  }
  if (foundInvalidLabels.length > 0) {
    core.info(`Invalid labels found: ${JSON.stringify(foundInvalidLabels)}`)
  }

  return {
    isValid: foundValidLabels.length > 0 && foundInvalidLabels.length === 0,
    validLabels: foundValidLabels,
    invalidLabels: foundInvalidLabels,
  }
}

const COMMENT_HEADER = '### 🏷️ Label Validation'

// Post or update a validation comment on the PR
export async function postValidationComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
  result: ValidationResult,
  expectedLabels: string[],
): Promise<void> {
  const lines: string[] = [COMMENT_HEADER, '']

  if (result.isValid) {
    lines.push(
      `✅ **Valid labels found:** ${result.validLabels.map((l) => `\`${l}\``).join(', ')}`,
    )
  } else {
    if (result.validLabels.length === 0) {
      lines.push(
        `❌ **No valid labels found.** Expected one of: ${expectedLabels.map((l) => `\`${l}\``).join(', ')}`,
      )
    } else {
      lines.push(
        `✅ **Valid labels found:** ${result.validLabels.map((l) => `\`${l}\``).join(', ')}`,
      )
    }
    if (result.invalidLabels.length > 0) {
      lines.push(
        `❌ **Invalid labels found:** ${result.invalidLabels.map((l) => `\`${l}\``).join(', ')}`,
      )
    }
  }

  const body = lines.join('\n')

  // Check for existing comment to update
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  })

  const existingComment = comments.find((comment) =>
    comment.body?.startsWith(COMMENT_HEADER),
  )

  if (existingComment) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existingComment.id,
      body,
    })
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    })
  }
}

run()
