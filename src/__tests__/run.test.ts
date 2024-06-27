import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPullRequestByNumber, run } from '../index'
import { RestEndpointMethodTypes } from '@octokit/rest'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']

jest.mock('@actions/core')
jest.mock('@actions/github')

const mockCore = core as jest.Mocked<typeof core>
const mockGithub = github as jest.Mocked<typeof github>

describe('GitHub Action - run', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock context.repo using Object.defineProperty
    Object.defineProperty(mockGithub.context, 'repo', {
      value: {
        owner: 'test-owner',
        repo: 'test-repo',
      },
      writable: true, // Ensure it can be modified
    })
  })

  it('should log valid and invalid labels', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'github-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return 'wontfix'
      if (name === 'pr-number') return '1'
      return ''
    })

    mockGithub.context.eventName = 'pull_request'

    const mockGetPullRequestByNumber = jest.fn() as jest.MockedFunction<
      typeof getPullRequestByNumber
    >

    mockGetPullRequestByNumber.mockResolvedValue({
      labels: [
        { name: 'bug', color: 'ffffff' },
        { name: 'wontfix', color: 'ff0000' },
      ],
    } as PullRequest)

    await run()

    expect(mockCore.info).toHaveBeenCalledWith(
      'Valid labels are: ["bug","enhancement"]',
    )
    expect(mockCore.info).toHaveBeenCalledWith(
      'Invalid labels are: ["wontfix"]',
    )
  })
})
