import { describe, it, expect } from 'vitest'
import { generateK8s } from '../k8s'

describe('k8s exporter', () => {
  it('generates deterministic manifests', () => {
    const bp = {
      services: [
        { name: 'API', type: 'api', ports: [3000], envKeys: ['FOO', 'BAR'] },
        { name: 'Web', type: 'web', ports: [8080], envKeys: [] },
      ],
      resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
      ports: [], envKeys: [], docker: { dockerfile: false, composeFiles: [] }, awsSdks: []
    }
    const out = generateK8s(bp as any)
    // Names sorted by service name
    expect(out.deployments[0].metadata.name).toBe('api')
    expect(out.deployments[1].metadata.name).toBe('web')
    // ConfigMap keys sorted
    const data = out.configMaps[0].data
    expect(Object.keys(data)).toEqual(['BAR','FOO'])
  })
})
