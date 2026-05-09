import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
}))

vi.mock('../index.js', () => ({
  run: mocks.run,
}))

describe('GitHub Action - entrypoint', () => {
  it('should run the action', async () => {
    await import('../main.js')

    expect(mocks.run).toHaveBeenCalledOnce()
  })
})
