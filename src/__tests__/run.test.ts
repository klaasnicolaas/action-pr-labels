import { describe, expect, it, beforeEach, vi } from 'vitest'
import * as core from '@actions/core'
import { run } from '../index.js'

vi.mock('@actions/core')
vi.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
    eventName: 'pull_request',
  },
  getOctokit: vi.fn(),
}))

describe('GitHub Action - run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log valid and invalid labels', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return 'wontfix'
      if (name === 'pr-number') return '1'
      return ''
    })

    await run()

    expect(core.info).toHaveBeenCalledWith(
      'Valid labels are: ["bug","enhancement"]',
    )
    expect(core.info).toHaveBeenCalledWith('Invalid labels are: ["wontfix"]')
  })

  it('should set outputs after successful validation', async () => {
    const mockOctokit = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'bug' }] },
          }),
        },
      },
    }

    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return 'wontfix'
      if (name === 'pr-number') return '1'
      return ''
    })

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('is-valid', true)
    expect(core.setOutput).toHaveBeenCalledWith('valid-labels-found', '["bug"]')
    expect(core.setOutput).toHaveBeenCalledWith('invalid-labels-found', '[]')
  })

  it('should set outputs after failed validation', async () => {
    const mockOctokit = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'wontfix' }] },
          }),
        },
      },
    }

    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return 'wontfix'
      if (name === 'pr-number') return '1'
      return ''
    })

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('is-valid', false)
    expect(core.setOutput).toHaveBeenCalledWith('valid-labels-found', '[]')
    expect(core.setOutput).toHaveBeenCalledWith(
      'invalid-labels-found',
      '["wontfix"]',
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('do not match the expected labels'),
    )
  })
})
