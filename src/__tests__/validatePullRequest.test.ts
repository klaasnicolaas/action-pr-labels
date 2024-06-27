import * as core from '@actions/core'
import { validatePullRequest } from '../index'
import { RestEndpointMethodTypes } from '@octokit/rest'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']

jest.mock('@actions/core')

const mockCore = core as jest.Mocked<typeof core>

describe('GitHub Action - validatePullRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log success message when labels match valid labels', async () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'enhancement' }],
    } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(mockCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid labels found:'),
    )
    expect(mockCore.info).toHaveBeenCalledWith(
      'Labels from this PR match the expected labels',
    )
  })

  it('should log success message even if some labels are invalid', async () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'wontfix' }],
    } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(mockCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid labels found:'),
    )
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Invalid labels found:'),
    )
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'Labels from this PR do not match the expected labels',
    )
  })

  it('should log failure message if no valid labels are found', async () => {
    const pr = { labels: [{ name: 'feature' }] } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'No valid labels found. Expected one of: bug, enhancement',
    )
  })

  it('should log failure message if only invalid labels are found', async () => {
    const pr = { labels: [{ name: 'wontfix' }] } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'No valid labels found. Expected one of: bug, enhancement',
    )
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Invalid labels found:'),
    )
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'Labels from this PR do not match the expected labels',
    )
  })
})
