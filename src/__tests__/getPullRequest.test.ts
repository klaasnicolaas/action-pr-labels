import * as core from '@actions/core'
import { getPullRequestByNumber } from '../index'

jest.mock('@actions/core')
jest.mock('@actions/github')

const mockCore = core as jest.Mocked<typeof core>

describe('GitHub Action - getPullRequestByNumber', () => {
  it('should return pull request details', async () => {
    const mockOctokit = {
      rest: {
        pulls: {
          get: jest.fn().mockResolvedValue({ data: { number: 1 } }),
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
          get: jest.fn().mockRejectedValue(new Error('API Error')),
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
    expect(mockCore.error).toHaveBeenCalledWith(
      'Error fetching pull request #1: Error: API Error',
    )
  })
})
