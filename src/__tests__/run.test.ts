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
    vi.mocked(core.getBooleanInput).mockReturnValue(false)
  })

  it('should log valid and invalid labels', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug, enhancement, '
      if (name === 'invalid-labels') return 'wontfix, '
      if (name === 'pr-number') return '1'
      return ''
    })

    await run()

    expect(core.info).toHaveBeenCalledWith(
      'Valid labels are: ["bug","enhancement"]',
    )
    expect(core.info).toHaveBeenCalledWith('Invalid labels are: ["wontfix"]')
  })

  it('should fail when the pull request number is invalid', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug'
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return 'abc'
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Error: Invalid pull request number: abc',
    )
  })

  it.each(['1e2', '1.0'])(
    'should fail when the pull request number uses a non-decimal format: %s',
    async (prNumber) => {
      vi.mocked(core.getInput).mockImplementation((name) => {
        if (name === 'repo-token') return 'fake-token'
        if (name === 'valid-labels') return 'bug'
        if (name === 'invalid-labels') return ''
        if (name === 'pr-number') return prNumber
        return ''
      })

      await run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `Error: Invalid pull request number: ${prNumber}`,
      )
    },
  )

  it('should fail when the pull request number is out of range', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug'
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return '0'
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Error: Invalid pull request number: 0',
    )
  })

  it('should fail when no valid labels are configured', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return ' , '
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return '1'
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Error: valid-labels must contain at least one non-empty label',
    )
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

  it('should create a comment when post-comment is enabled', async () => {
    const mockCreateComment = vi.fn()
    const mockListComments = vi.fn()
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'bug' }] },
          }),
        },
        issues: {
          listComments: mockListComments,
          createComment: mockCreateComment,
        },
      },
    }

    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return '1'
      return ''
    })
    vi.mocked(core.getBooleanInput).mockReturnValue(true)

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(mockOctokit.paginate).toHaveBeenCalledWith(mockListComments, {
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      per_page: 100,
    })
    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      body: expect.stringContaining('<!-- action-pr-labels -->'),
    })
  })

  it('should update existing comment when one already exists', async () => {
    const mockUpdateComment = vi.fn()
    const mockListComments = vi.fn()
    const mockOctokit = {
      paginate: vi
        .fn()
        .mockResolvedValue([
          { id: 42, body: '### 🏷️ Label Validation\n\nOld content' },
        ]),
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'bug' }] },
          }),
        },
        issues: {
          listComments: mockListComments,
          updateComment: mockUpdateComment,
        },
      },
    }

    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug'
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return '1'
      return ''
    })
    vi.mocked(core.getBooleanInput).mockReturnValue(true)

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(mockUpdateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      comment_id: 42,
      body: expect.stringContaining('Label Validation'),
    })
  })

  it('should not post a comment when post-comment is disabled', async () => {
    const mockListComments = vi.fn()
    const mockOctokit = {
      paginate: vi.fn(),
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'bug' }] },
          }),
        },
        issues: {
          listComments: mockListComments,
        },
      },
    }

    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug'
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return '1'
      return ''
    })

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(mockListComments).not.toHaveBeenCalled()
    expect(mockOctokit.paginate).not.toHaveBeenCalled()
  })

  it('should post comment when no valid labels are found', async () => {
    const mockCreateComment = vi.fn()
    const mockListComments = vi.fn()
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'random' }] },
          }),
        },
        issues: {
          listComments: mockListComments,
          createComment: mockCreateComment,
        },
      },
    }

    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'repo-token') return 'fake-token'
      if (name === 'valid-labels') return 'bug,enhancement'
      if (name === 'invalid-labels') return ''
      if (name === 'pr-number') return '1'
      return ''
    })
    vi.mocked(core.getBooleanInput).mockReturnValue(true)

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      body: expect.stringContaining('No valid labels found'),
    })
  })

  it('should post comment when invalid labels are found', async () => {
    const mockCreateComment = vi.fn()
    const mockListComments = vi.fn()
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'bug' }, { name: 'wontfix' }] },
          }),
        },
        issues: {
          listComments: mockListComments,
          createComment: mockCreateComment,
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
    vi.mocked(core.getBooleanInput).mockReturnValue(true)

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      body: expect.stringContaining('Invalid labels found'),
    })
  })

  it('should post comment with mixed valid and invalid labels', async () => {
    const mockCreateComment = vi.fn()
    const mockListComments = vi.fn()
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { labels: [{ name: 'bug' }, { name: 'wontfix' }] },
          }),
        },
        issues: {
          listComments: mockListComments,
          createComment: mockCreateComment,
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
    vi.mocked(core.getBooleanInput).mockReturnValue(true)

    const github = await import('@actions/github')
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

    await run()

    const createCallBody = mockCreateComment.mock.calls[0][0].body
    expect(createCallBody).toContain('Valid labels found')
    expect(createCallBody).toContain('Invalid labels found')
  })
})
