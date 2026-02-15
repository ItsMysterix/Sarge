use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceDefinition {
    pub name: String,
    pub image: String,
    pub ports: Vec<u16>,
    pub env: HashMap<String, String>,
    pub depends_on: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ServiceStatus {
    Starting,
    Running,
    Failed(String),
    Stopped,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeploymentState {
    pub id: String,
    pub status: ServiceStatus,
    pub logs: Vec<String>,
    pub container_id: Option<String>,
}

pub type DeploymentMap = dashmap::DashMap<String, DeploymentState>;
