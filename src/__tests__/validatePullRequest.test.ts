import * as core from '@actions/core'
import { validatePullRequest } from '../index'
import { RestEndpointMethodTypes } from '@octokit/rest'

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
      'Valid labels found: ["bug","enhancement"]',
    )
    expect(mockCore.info).toHaveBeenCalledWith('No invalid labels found')
    expect(mockCore.info).toHaveBeenCalledWith(
      'Labels from this PR match the expected labels',
    )
  })

  it('should log success message even if some labels are invalid', async () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'wontfix' }],
    } as PullRequest

    await validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(mockCore.info).toHaveBeenCalledWith('Valid labels found: ["bug"]')
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'Invalid labels found: wontfix',
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
      'Invalid labels found: wontfix',
    )
  })
})
