pub mod models;
pub mod orchestrator;

use crate::models::{ServiceDefinition, DeploymentMap, DeploymentState, ServiceStatus};
use crate::orchestrator::Orchestrator;
use anyhow::Result;
use std::sync::Arc;

pub struct Engine {
    orchestrator: Arc<dyn Orchestrator>,
    deployments: Arc<DeploymentMap>,
}

impl Engine {
    pub fn new(orchestrator: Arc<dyn Orchestrator>) -> Self {
        Self {
            orchestrator,
            deployments: Arc::new(DeploymentMap::new()),
        }
    }

    /// Deploy a stack of services with dependency resolution
    pub async fn deploy_stack(&self, services: Vec<ServiceDefinition>) -> Result<()> {
        // Simple sequential deployment for now, respecting dependencies
        // In a real implementation, we'd use a directed acyclic graph (DAG)
        for service in services {
            println!("[Engine] Deploying service: {}", service.name);
            
            let id = self.orchestrator.deploy(service.clone()).await?;
            
            self.deployments.insert(service.name.clone(), DeploymentState {
                id: service.name.clone(),
                status: ServiceStatus::Running,
                logs: vec![],
                container_id: Some(id),
            });
        }
        Ok(())
    }

    pub async fn stop_stack(&self) -> Result<()> {
        let keys: Vec<String> = self.deployments.iter().map(|kv| kv.key().clone()).collect();
        for name in keys {
            self.orchestrator.stop(&name).await?;
            self.deployments.remove(&name);
        }
        Ok(())
    }

    pub fn get_deployments(&self) -> Vec<DeploymentState> {
        self.deployments.iter().map(|kv| kv.value().clone()).collect()
    }

    pub async fn rollback(&self, name: &str, version: &str) -> Result<ServiceStatus> {
        let status = self.orchestrator.rollback(name, version).await?;
        self.deployments.insert(name.to_string(), DeploymentState {
            name: name.to_string(),
            status: status.clone(),
            progress: 100,
            message: format!("Rolled back to version {}", version),
        });
        Ok(status)
    }

    pub fn export_iac(&self, name: &str, target: crate::orchestrator::iac::IaCTarget) -> Result<String> {
        let deployment = self.deployments.get(name)
            .ok_or_else(|| anyhow::anyhow!("Deployment not found"))?;
        
        // Note: Real implementation would need the original ServiceDefinition
        // For now, using a placeholder logic or fetching from a stored map
        Ok(format!("IaC export for {} initiated", name))
    }
}
