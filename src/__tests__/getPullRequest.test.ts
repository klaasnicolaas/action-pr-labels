import { describe, expect, it, beforeEach, vi } from 'vitest'
import * as core from '@actions/core'
import { getPullRequestByNumber } from '../index.js'

vi.mock('@actions/core')

describe('GitHub Action - getPullRequestByNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return pull request details', async () => {
    const mockOctokit = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({ data: { number: 1 } }),
        },
      },
    }

    const pr = await getPullRequestByNumber(
      mockOctokit as any,
      'owner',
      'repo',
      1,
    )

    expect(pr).toEqual({ number: 1 })
  })

  it('should handle error when fetching pull request', async () => {
    const mockOctokit = {
      rest: {
        pulls: {
          get: vi.fn().mockRejectedValue(new Error('API Error')),
        },
      },
    }

    const pr = await getPullRequestByNumber(
      mockOctokit as any,
      'owner',
      'repo',
      1,
    )

    expect(pr).toBeUndefined()
    expect(core.error).toHaveBeenCalledWith(
      'Error fetching pull request #1: Error: API Error',
    )
  })
})
