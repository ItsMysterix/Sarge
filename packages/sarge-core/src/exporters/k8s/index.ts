import * as fs from 'fs'
import * as path from 'path'
import YAML from 'yaml'
import { StackBlueprint } from '../../detector/schema'

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function toName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'app'
}

function doc(obj: any) {
  // Consistent YAML with sorted keys
  return YAML.stringify(obj, { sortMapEntries: true })
}

export function generateK8s(bp: StackBlueprint) {
  const namespace = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: 'sarge' },
  }

  const deployments: any[] = []
  const services: any[] = []
  const configMaps: any[] = []
  const secrets: any[] = []

  const svcs = [...(bp.services ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  for (const s of svcs) {
    const n = toName(s.name)
    const dep = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: n, namespace: 'sarge' },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: n } },
        template: {
          metadata: { labels: { app: n } },
          spec: {
            containers: [
              {
                name: n,
                image: 'ghcr.io/itsmysterix/sarge-service:latest',
                args: s.startCommand ? s.startCommand.split(' ') : undefined,
                ports: (s.ports || []).map((p) => ({ containerPort: p })),
                envFrom: [
                  { configMapRef: { name: `${n}-config` } },
                  { secretRef: { name: `${n}-secret` } },
                ],
                readinessProbe: s.health?.http
                  ? { httpGet: { path: s.health.http.path, port: s.health.http.port || (s.ports?.[0] || 80) } }
                  : undefined,
                livenessProbe: s.health?.tcp
                  ? { tcpSocket: { port: s.health.tcp.port } }
                  : undefined,
              },
            ],
          },
        },
      },
    }
    deployments.push(dep)

    const svc = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: n, namespace: 'sarge' },
      spec: {
        selector: { app: n },
        ports: (s.ports || []).map((p) => ({ name: `p${p}`, port: p, targetPort: p })),
        type: 'ClusterIP',
      },
    }
    if (svc.spec.ports.length > 0) services.push(svc)

    const cm = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: `${n}-config`, namespace: 'sarge' },
      data: Object.fromEntries((s.envKeys || []).sort().map((k) => [k, ''])) as Record<string, string>,
    }
    configMaps.push(cm)

    const sec = {
      apiVersion: 'v1',
      kind: 'Secret',
      type: 'Opaque',
      metadata: { name: `${n}-secret`, namespace: 'sarge' },
      stringData: {},
    }
    secrets.push(sec)
  }

  return { namespace, deployments, services, configMaps, secrets }
}

export async function exportK8s(bp: StackBlueprint, opts: { outDir: string }) {
  const outRoot = path.resolve(opts.outDir)
  const dir = path.join(outRoot, 'k8s')
  ensureDir(dir)
  const files: string[] = []
  const { namespace, deployments, services, configMaps, secrets } = generateK8s(bp)

  const mapping: Array<[string, any[] | any]> = [
    ['namespace.yaml', namespace],
    ['deployments.yaml', deployments],
    ['services.yaml', services],
    ['configmaps.yaml', configMaps],
    ['secrets.yaml', secrets],
  ]
  for (const [name, data] of mapping) {
    const file = path.join(dir, name)
    const text = Array.isArray(data)
      ? data.map((d) => doc(d)).join('---\n')
      : doc(data)
    fs.writeFileSync(file, text)
    files.push(file)
  }
  return { files }
}
