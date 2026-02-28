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
import { NeonProvider } from './neon'
import { SupabaseProvider } from './supabase'
import { PlanetScaleProvider } from './planetscale'
import { TursoProvider } from './turso'
import { UpstashProvider } from './upstash'
import { PosthogProvider } from './posthog'
import { StripeProvider } from './stripe'
import { ResendProvider } from './resend'
import { SendGridProvider } from './sendgrid'
import { TwilioProvider } from './twilio'
import { DockerProvider } from './docker'
import { GithubProvider } from './github'
import { GitlabProvider } from './gitlab'
import { CircleCIProvider } from './circleci'
import { NetlifyProvider } from './netlify'
import { HerokuProvider } from './heroku'
import { DigitalOceanProvider } from './digitalocean'
import { MongoDBProvider } from './mongodb'
import { CockroachProvider } from './cockroach'
import { FaunaProvider } from './fauna'
import { ClickHouseProvider } from './clickhouse'
import { BackblazeProvider } from './backblaze'
import { OpenAIProvider } from './openai'
import { ReplicateProvider } from './replicate'
import { HuggingFaceProvider } from './huggingface'
import { PineconeProvider } from './pinecone'
import { WeaviateProvider } from './weaviate'
import { Auth0Provider } from './auth0'
import { ClerkProvider } from './clerk'
import { SentryProvider } from './sentry'
import { NewRelicProvider } from './newrelic'
import { DopplerProvider } from './doppler'
import { BetterStackProvider } from './betterstack'
import { AxiomProvider } from './axiom'
import { DatadogProvider } from './datadog'
import { FastlyProvider } from './fastly'
import { AkamaiProvider } from './akamai'
import { PusherProvider } from './pusher'
import { RabbitMQProvider } from './rabbitmq'
import { ConfluentProvider } from './confluent'
import { SegmentProvider } from './segment'
import { AlgoliaProvider } from './algolia'
import { MeilisearchProvider } from './meilisearch'
import { ElasticProvider } from './elastic'
import { ContentfulProvider } from './contentful'
import { StrapiProvider } from './strapi'
import { SanityProvider } from './sanity'
import { PayPalProvider } from './paypal'
import { AlchemyProvider } from './alchemy'
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
  LocalProvider, VercelProvider, RailwayProvider, RenderProvider, CloudflareProvider,
  AWSProvider, FlyProvider, GCPProvider, AzureProvider, KubernetesProvider, TerraformProvider,
  NeonProvider, SupabaseProvider, PlanetScaleProvider, TursoProvider, UpstashProvider,
  PosthogProvider, StripeProvider, ResendProvider, SendGridProvider, TwilioProvider,
  DockerProvider, GithubProvider, GitlabProvider, CircleCIProvider,
  NetlifyProvider, HerokuProvider, DigitalOceanProvider,
  MongoDBProvider, CockroachProvider, FaunaProvider, ClickHouseProvider, BackblazeProvider,
  OpenAIProvider, ReplicateProvider, HuggingFaceProvider, PineconeProvider, WeaviateProvider,
  Auth0Provider, ClerkProvider, SentryProvider, NewRelicProvider, DopplerProvider,
  BetterStackProvider, AxiomProvider, DatadogProvider,
  FastlyProvider, AkamaiProvider,
  PusherProvider, RabbitMQProvider, ConfluentProvider, SegmentProvider,
  AlgoliaProvider, MeilisearchProvider, ElasticProvider,
  ContentfulProvider, StrapiProvider, SanityProvider,
  PayPalProvider, AlchemyProvider,
  SlackProvider, DiscordProvider, NotionProvider, LinearProvider, JiraProvider, AsanaProvider, HubspotProvider, SalesforceProvider
}

/**
 * Factory to get provider instance by ID.
 * Maps every provider string referenced in InfrastructureBlueprint to a concrete class.
 */
export function getProvider(providerId: string): IProvider | null {
  const map: Record<string, () => IProvider> = {
    local: () => new LocalProvider(),
    vercel: () => new VercelProvider(),
    railway: () => new RailwayProvider(),
    render: () => new RenderProvider(),
    cloudflare: () => new CloudflareProvider(),
    aws: () => new AWSProvider(),
    fly: () => new FlyProvider(),
    gcp: () => new GCPProvider(),
    azure: () => new AzureProvider(),
    kubernetes: () => new KubernetesProvider(),
    terraform: () => new TerraformProvider(),
    neon: () => new NeonProvider(),
    supabase: () => new SupabaseProvider(),
    planetscale: () => new PlanetScaleProvider(),
    turso: () => new TursoProvider(),
    upstash: () => new UpstashProvider(),
    posthog: () => new PosthogProvider(),
    stripe: () => new StripeProvider(),
    resend: () => new ResendProvider(),
    sendgrid: () => new SendGridProvider(),
    twilio: () => new TwilioProvider(),
    docker: () => new DockerProvider(),
    github: () => new GithubProvider(),
    gitlab: () => new GitlabProvider(),
    circleci: () => new CircleCIProvider(),
    netlify: () => new NetlifyProvider(),
    heroku: () => new HerokuProvider(),
    digitalocean: () => new DigitalOceanProvider(),
    mongodb: () => new MongoDBProvider(),
    cockroach: () => new CockroachProvider(),
    fauna: () => new FaunaProvider(),
    clickhouse: () => new ClickHouseProvider(),
    backblaze: () => new BackblazeProvider(),
    openai: () => new OpenAIProvider(),
    replicate: () => new ReplicateProvider(),
    huggingface: () => new HuggingFaceProvider(),
    pinecone: () => new PineconeProvider(),
    weaviate: () => new WeaviateProvider(),
    auth0: () => new Auth0Provider(),
    clerk: () => new ClerkProvider(),
    sentry: () => new SentryProvider(),
    newrelic: () => new NewRelicProvider(),
    doppler: () => new DopplerProvider(),
    betterstack: () => new BetterStackProvider(),
    axiom: () => new AxiomProvider(),
    datadog: () => new DatadogProvider(),
    fastly: () => new FastlyProvider(),
    akamai: () => new AkamaiProvider(),
    pusher: () => new PusherProvider(),
    rabbitmq: () => new RabbitMQProvider(),
    confluent: () => new ConfluentProvider(),
    segment: () => new SegmentProvider(),
    algolia: () => new AlgoliaProvider(),
    meilisearch: () => new MeilisearchProvider(),
    elastic: () => new ElasticProvider(),
    contentful: () => new ContentfulProvider(),
    strapi: () => new StrapiProvider(),
    sanity: () => new SanityProvider(),
    paypal: () => new PayPalProvider(),
    alchemy: () => new AlchemyProvider(),
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
