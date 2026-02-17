use bollard::container::{Config, CreateContainerOptions, StartContainerOptions};
use bollard::Docker;
use crate::models::{ServiceDefinition, ServiceStatus};
use crate::orchestrator::Orchestrator;
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use std::collections::HashMap;

pub struct DockerOrchestrator {
    docker: Docker,
}

impl DockerOrchestrator {
    pub fn new() -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()
            .map_err(|e| anyhow!("Failed to connect to Docker: {}", e))?;
        Ok(Self { docker })
    }
}

#[async_trait]
impl Orchestrator for DockerOrchestrator {
    async fn deploy(&self, service: ServiceDefinition) -> Result<ServiceStatus> {
        let container_name = format!("sarge-{}", service.name);

        // 1. Setup config
        let env: Vec<String> = service.env.iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect();

        let mut exposed_ports = HashMap::new();
        for port in &service.ports {
            exposed_ports.insert(format!("{}/tcp", port), HashMap::new());
        }

        let config = Config {
            image: Some(service.image),
            env: Some(env),
            exposed_ports: Some(exposed_ports),
            ..Default::default()
        };

        // 2. Create container
        let create_options = CreateContainerOptions {
            name: container_name.clone(),
            ..Default::default()
        };

        let container = self.docker.create_container(Some(create_options), config).await?;
        let id = container.id;

        // 3. Start container
        self.docker.start_container(&id, None::<StartContainerOptions<String>>).await?;

        Ok(id)
    }

    async fn stop(&self, name: &str) -> Result<()> {
        let container_name = format!("sarge-{}", name);
        self.docker.stop_container(&container_name, None).await?;
        self.docker.remove_container(&container_name, None).await?;
        Ok(())
    }

    async fn status(&self, name: &str) -> Result<ServiceStatus> {
        let container_name = format!("sarge-{}", name);
        let inspect = self.docker.inspect_container(&container_name, None).await?;
        
        let state = inspect.state.ok_or_else(|| anyhow!("No state found"))?;
        if state.running.unwrap_or(false) {
            Ok(ServiceStatus::Running)
        } else if state.error.is_some() && !state.error.as_ref().unwrap().is_empty() {
            Ok(ServiceStatus::Failed(state.error.unwrap()))
        } else {
            Ok(ServiceStatus::Stopped)
        }
    }

    async fn logs(&self, _name: &str) -> Result<Vec<String>> {
        // Implementation for log streaming would go here
        Ok(vec![])
    }
}
