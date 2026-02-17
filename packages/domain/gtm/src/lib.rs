pub mod models;
use crate::models::{GtmPolicy, RoutingStrategy, Endpoint};
use anyhow::{Result, anyhow};

pub struct GtmEngine;

impl GtmEngine {
    pub fn resolve(policy: &GtmPolicy) -> Result<Endpoint> {
        let healthy_endpoints: Vec<&Endpoint> = policy.endpoints.iter()
            .filter(|e| e.healthy)
            .collect();

        if healthy_endpoints.is_empty() {
            return Err(anyhow!("No healthy endpoints available for policy {}", policy.name));
        }

        match policy.strategy {
            RoutingStrategy::Failover => {
                // Priority based on index
                Ok(healthy_endpoints[0].clone())
            }
            RoutingStrategy::Latency => {
                // Return endpoint with lowest latency
                Ok(healthy_endpoints.iter()
                    .min_by_key(|e| e.latency_ms.unwrap_or(u64::MAX))
                    .map(|e| (*e).clone())
                    .unwrap())
            }
            RoutingStrategy::WeightedRoundRobin => {
                // simplified: pick highest weight among healthy
                Ok(healthy_endpoints.iter()
                    .max_by_key(|e| e.weight)
                    .map(|e| (*e).clone())
                    .unwrap())
            }
            RoutingStrategy::Geolocation => {
                // In a real implementation, would match user's region to e.region
                Ok(healthy_endpoints[0].clone())
            }
        }
    }
}
