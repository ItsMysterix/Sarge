pub mod docker;
pub mod iac;

use crate::models::{ServiceDefinition, ServiceStatus};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait Orchestrator: Send + Sync {
    async fn deploy(&self, service: ServiceDefinition) -> Result<ServiceStatus>;
    async fn rollback(&self, name: &str, version: &str) -> Result<ServiceStatus>;
    async fn stop(&self, name: &str) -> Result<()>;
    async fn status(&self, name: &str) -> Result<ServiceStatus>;
    async fn logs(&self, name: &str) -> Result<Vec<String>>;
}
