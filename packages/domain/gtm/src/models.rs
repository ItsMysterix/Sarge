use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum RoutingStrategy {
    Failover,
    Latency,
    Geolocation,
    WeightedRoundRobin,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Endpoint {
    pub id: String,
    pub address: String,
    pub region: String,
    pub weight: u32,
    pub healthy: bool,
    pub latency_ms: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GtmPolicy {
    pub name: String,
    pub strategy: RoutingStrategy,
    pub endpoints: Vec<Endpoint>,
}
