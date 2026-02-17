import { IProvider } from './types'
import { LocalProvider } from './local'
import { VercelProvider } from './vercel'
import { RailwayProvider } from './railway'
import { RenderProvider } from './render'
import { CloudflareProvider } from './cloudflare'
import { AWSProvider } from './aws'
import { FlyProvider } from './fly'
import { GCPProvider } from './gcp'
import { AzureProvider } from './azure'
import { KubernetesProvider } from './kubernetes'
import { TerraformProvider } from './terraform'

export * from './types'
export { LocalProvider, VercelProvider, RailwayProvider, RenderProvider, CloudflareProvider, AWSProvider, FlyProvider, GCPProvider, AzureProvider, KubernetesProvider, TerraformProvider }

/**
 * Factory to get provider instance
 */
export function getProvider(providerId: string): IProvider | null {
  switch (providerId) {
    case 'local':
      return new LocalProvider()
    case 'vercel':
      return new VercelProvider()
    case 'railway':
      return new RailwayProvider()
    case 'render':
      return new RenderProvider()
    case 'cloudflare':
      return new CloudflareProvider()
    case 'aws':
      return new AWSProvider()
    case 'fly':
      return new FlyProvider()
    case 'gcp':
      return new GCPProvider()
    case 'azure':
      return new AzureProvider()
    case 'kubernetes':
      return new KubernetesProvider()
    case 'terraform':
      return new TerraformProvider()
    default:
      // Fallback to local provider if no match
      return new LocalProvider()
  }
}

export default { getProvider, LocalProvider, VercelProvider, RailwayProvider, RenderProvider, CloudflareProvider, AWSProvider, FlyProvider, GCPProvider, AzureProvider, KubernetesProvider, TerraformProvider }
