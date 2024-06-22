import * as core from '@actions/core'
import * as github from '@actions/github'
import { run } from '../src/index'

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

    const mockGetPullRequestByNumber = jest.fn()
    mockGetPullRequestByNumber.mockResolvedValue({
      labels: [{ name: 'bug' }, { name: 'wontfix' }],
    })

    await run()

    expect(mockCore.info).toHaveBeenCalledWith(
      'Valid labels are: ["bug","enhancement"]',
    )
    expect(mockCore.info).toHaveBeenCalledWith(
      'Invalid labels are: ["wontfix"]',
    )
  })

  it('should fail if pr-number is required but not provided', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'github-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return 'wontfix'
      return ''
    })

    mockGithub.context.eventName = 'pull_request_target'

    await run()

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'Error: pr-number is required for pull_request_target events',
    )
  })
})
