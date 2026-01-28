import { describe, expect, it } from 'vitest'
import { matchesPattern } from '../index.js'

describe('matchesPattern', () => {
  it('should match exact label names', () => {
    expect(matchesPattern('bug', 'bug')).toBe(true)
    expect(matchesPattern('enhancement', 'enhancement')).toBe(true)
  })

  it('should not match different label names', () => {
    expect(matchesPattern('bug', 'enhancement')).toBe(false)
    expect(matchesPattern('feature', 'bug')).toBe(false)
  })

  it('should match glob patterns with trailing wildcard', () => {
    expect(matchesPattern('type/bug', 'type/*')).toBe(true)
    expect(matchesPattern('type/feature', 'type/*')).toBe(true)
    expect(matchesPattern('scope-frontend', 'scope-*')).toBe(true)
  })

  it('should not match when glob pattern does not apply', () => {
    expect(matchesPattern('other/bug', 'type/*')).toBe(false)
    expect(matchesPattern('bug', 'scope-*')).toBe(false)
  })

  it('should match glob patterns with leading wildcard', () => {
    expect(matchesPattern('bug-fix', '*-fix')).toBe(true)
    expect(matchesPattern('bug-fix', '*-bug')).toBe(false)
  })

  it('should match patterns with multiple wildcards', () => {
    expect(matchesPattern('a-b-c', '*-*-*')).toBe(true)
    expect(matchesPattern('a-b', '*-*')).toBe(true)
  })

  it('should treat dots as literal characters', () => {
    expect(matchesPattern('type.bug', 'type.bug')).toBe(true)
    expect(matchesPattern('typexbug', 'type.bug')).toBe(false)
  })
})
