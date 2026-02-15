use serde_json::Value;
use anyhow::{Result, anyhow};
use sarge_engine::orchestrator::iac::{IaCTranspiler, IaCTarget};
use sarge_engine::models::ServiceDefinition;

pub async fn handle(params: Value) -> Result<Value> {
    let target_str = params.get("target")
        .and_then(|t| t.as_str())
        .ok_or_else(|| anyhow!("Missing 'target' parameter"))?;

    let service_val = params.get("service")
        .ok_or_else(|| anyhow!("Missing 'service' parameter"))?;

    let service: ServiceDefinition = serde_json::from_value(service_val.clone())?;

    let target = match target_str {
        "kubernetes" => IaCTarget::Kubernetes,
        "terraform" => IaCTarget::TerraformAWS,
        _ => return Err(anyhow!("Unsupported IaC target: {}", target_str)),
    };

    let manifest = IaCTranspiler::transpile(target, &service)?;

    Ok(serde_json::json!({
        "manifest": manifest,
        "format": target_str,
    }))
}
