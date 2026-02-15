use serde_json::Value;
use anyhow::{Result, anyhow};
use sarge_remediation::RemediationEngine;
use sarge_remediation::models::Incident;

pub async fn handle(params: Value) -> Result<Value> {
    let incident: Incident = serde_json::from_value(params.clone())?;
    
    let engine = RemediationEngine;
    let actions = engine.plan(&incident)?;

    Ok(serde_json::to_value(actions)?)
}
