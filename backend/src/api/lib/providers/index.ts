import { IProvider } from './types'
import { LocalProvider } from './local'
import { VercelProvider } from './vercel'
import { CloudflareProvider } from './cloudflare'
import { AWSProvider } from './aws'
import { GCPProvider } from './gcp'
import { KubernetesProvider } from './kubernetes'
import { TerraformProvider } from './terraform'
import { SupabaseProvider } from './supabase'
import { PosthogProvider } from './posthog'
import { StripeProvider } from './stripe'
import { ResendProvider } from './resend'
import { SendGridProvider } from './sendgrid'
import { TwilioProvider } from './twilio'
import { DockerProvider } from './docker'
import { GithubProvider } from './github'
import { GitlabProvider } from './gitlab'
import { DigitalOceanProvider } from './digitalocean'
import { OpenAIProvider } from './openai'
import { ReplicateProvider } from './replicate'
import { Auth0Provider } from './auth0'
import { ClerkProvider } from './clerk'
import { SentryProvider } from './sentry'
import { DatadogProvider } from './datadog'
import { SegmentProvider } from './segment'
import { AlgoliaProvider } from './algolia'
import { ContentfulProvider } from './contentful'
import { PayPalProvider } from './paypal'
import { SlackProvider } from './slack'
import { DiscordProvider } from './discord'
import { NotionProvider } from './notion'
import { LinearProvider } from './linear'
import { JiraProvider } from './jira'
import { AsanaProvider } from './asana'
import { HubspotProvider } from './hubspot'
import { SalesforceProvider } from './salesforce'

export * from './types'

export {
  LocalProvider, VercelProvider, CloudflareProvider,
  AWSProvider, GCPProvider, KubernetesProvider, TerraformProvider,
  SupabaseProvider, PosthogProvider, StripeProvider, ResendProvider, SendGridProvider, TwilioProvider,
  DockerProvider, GithubProvider, GitlabProvider, DigitalOceanProvider,
  OpenAIProvider, ReplicateProvider, Auth0Provider, ClerkProvider, SentryProvider, DatadogProvider,
  SegmentProvider,
  AlgoliaProvider, ContentfulProvider, PayPalProvider, SlackProvider, DiscordProvider, NotionProvider, LinearProvider, JiraProvider, AsanaProvider, HubspotProvider, SalesforceProvider
}

/**
 * Factory to get provider instance by ID.
 * Maps every provider string referenced in InfrastructureBlueprint to a concrete class.
 */
export function getProvider(providerId: string): IProvider | null {
  const map: Record<string, () => IProvider> = {
    local: () => new LocalProvider(),
    vercel: () => new VercelProvider(),
    cloudflare: () => new CloudflareProvider(),
    aws: () => new AWSProvider(),
    gcp: () => new GCPProvider(),
    kubernetes: () => new KubernetesProvider(),
    terraform: () => new TerraformProvider(),
    supabase: () => new SupabaseProvider(),
    posthog: () => new PosthogProvider(),
    stripe: () => new StripeProvider(),
    resend: () => new ResendProvider(),
    sendgrid: () => new SendGridProvider(),
    twilio: () => new TwilioProvider(),
    docker: () => new DockerProvider(),
    github: () => new GithubProvider(),
    gitlab: () => new GitlabProvider(),
    digitalocean: () => new DigitalOceanProvider(),
    openai: () => new OpenAIProvider(),
    replicate: () => new ReplicateProvider(),
    auth0: () => new Auth0Provider(),
    clerk: () => new ClerkProvider(),
    sentry: () => new SentryProvider(),
    datadog: () => new DatadogProvider(),
    segment: () => new SegmentProvider(),
    algolia: () => new AlgoliaProvider(),
    contentful: () => new ContentfulProvider(),
    paypal: () => new PayPalProvider(),
    slack: () => new SlackProvider(),
    discord: () => new DiscordProvider(),
    notion: () => new NotionProvider(),
    linear: () => new LinearProvider(),
    jira: () => new JiraProvider(),
    asana: () => new AsanaProvider(),
    hubspot: () => new HubspotProvider(),
    salesforce: () => new SalesforceProvider(),
  }

  const factory = map[providerId]
  return factory ? factory() : new LocalProvider()
}
