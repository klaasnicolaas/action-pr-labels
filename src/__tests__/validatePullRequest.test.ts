import { describe, expect, it, beforeEach, vi } from 'vitest'
import { RestEndpointMethodTypes } from '@octokit/rest'
import * as core from '@actions/core'
import { validatePullRequest } from '../index.js'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']

vi.mock('@actions/core')

describe('GitHub Action - validatePullRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log success message when labels match valid labels', async () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'enhancement' }],
    } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid labels found:'),
    )
    expect(core.info).toHaveBeenCalledWith(
      'Labels from this PR match the expected labels',
    )
  })

  it('should log success message even if some labels are invalid', async () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'wontfix' }],
    } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid labels found:'),
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Invalid labels found:'),
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      'Labels from this PR do not match the expected labels',
    )
  })

  it('should log failure message if no valid labels are found', async () => {
    const pr = { labels: [{ name: 'feature' }] } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(core.setFailed).toHaveBeenCalledWith(
      'No valid labels found. Expected one of: bug, enhancement',
    )
  })

  it('should log failure message if only invalid labels are found', async () => {
    const pr = { labels: [{ name: 'wontfix' }] } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(core.setFailed).toHaveBeenCalledWith(
      'No valid labels found. Expected one of: bug, enhancement',
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Invalid labels found:'),
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      'Labels from this PR do not match the expected labels',
    )
  })
})
