import { describe, it, expect } from 'vitest'

describe('ESM Exports', () => {
  it('should import all public exports from dist/index.js', async () => {
    const module = await import('../../dist/index.js')

    expect(module.createClient).toBeDefined()
    expect(typeof module.createClient).toBe('function')

    expect(module.createWorker).toBeDefined()
    expect(typeof module.createWorker).toBe('function')

    expect(module.createWorkerFactory).toBeDefined()
    expect(typeof module.createWorkerFactory).toBe('function')

    expect(module.registryWorkerFactory).toBeDefined()
    expect(typeof module.registryWorkerFactory).toBe('function')

    expect(module.createSharedWorkerRuntime).toBeDefined()
    expect(typeof module.createSharedWorkerRuntime).toBe('function')

    expect(module.wrapWorkerPort).toBeDefined()
    expect(typeof module.wrapWorkerPort).toBe('function')

    expect(module.subscriptions).toBeDefined()
    expect(typeof module.subscriptions).toBe('function')
  })

  it('should have accessible type exports (no runtime validation)', async () => {
    const module = await import('../../dist/index.js')

    expect(module.createClient).toBeDefined()
  })
})
