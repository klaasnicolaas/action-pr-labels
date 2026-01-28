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

  it('should return valid result when labels match valid labels', () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'enhancement' }],
    } as PullRequest

    const result = validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(result.isValid).toBe(true)
    expect(result.validLabels).toEqual(['bug', 'enhancement'])
    expect(result.invalidLabels).toEqual([])
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid labels found:'),
    )
  })

  it('should return invalid result when invalid labels are present', () => {
    const pr = {
      labels: [{ name: 'bug' }, { name: 'wontfix' }],
    } as PullRequest

    const result = validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(result.isValid).toBe(false)
    expect(result.validLabels).toEqual(['bug'])
    expect(result.invalidLabels).toEqual(['wontfix'])
  })

  it('should return invalid result when no valid labels are found', () => {
    const pr = { labels: [{ name: 'feature' }] } as PullRequest

    const result = validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(result.isValid).toBe(false)
    expect(result.validLabels).toEqual([])
    expect(result.invalidLabels).toEqual([])
  })

  it('should return invalid result when only invalid labels are found', () => {
    const pr = { labels: [{ name: 'wontfix' }] } as PullRequest

    const result = validatePullRequest(pr, ['bug', 'enhancement'], ['wontfix'])

    expect(result.isValid).toBe(false)
    expect(result.validLabels).toEqual([])
    expect(result.invalidLabels).toEqual(['wontfix'])
  })
})
