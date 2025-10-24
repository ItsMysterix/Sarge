import { describe, it, expect } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateMarkdown } = require('../generate-trpc-docs.js')

describe('tRPC docs generator', () => {
  it('produces markdown with routers and procedures', () => {
    const md = generateMarkdown()
    expect(md).toContain('# tRPC API Reference')
    expect(md).toMatch(/## Router: (deploy|metrics|logs|services)/)
    expect(md).toMatch(/\| create \| (mutation|query)/)
  })
})
