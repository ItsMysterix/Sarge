use serde_json::Value;
use anyhow::{Result, anyhow};
use sarge_rbac::engine::RbacEngine;
use sarge_rbac::models::{Action, Resource};

pub async fn handle(params: Value) -> Result<Value> {
    let user_id = params.get("userId")
        .and_then(|u| u.as_str())
        .ok_or_else(|| anyhow!("Missing 'userId' parameter"))?;

    let resource_val = params.get("resource")
        .ok_or_else(|| anyhow!("Missing 'resource' parameter"))?;
    
    let action_val = params.get("action")
        .ok_or_else(|| anyhow!("Missing 'action' parameter"))?;

    let resource: Resource = serde_json::from_value(resource_val.clone())?;
    let action: Action = serde_json::from_value(action_val.clone())?;

    // In a real implementation, the RBAC engine would be a shared state
    // For this demonstration, we instantiate one.
    let engine = RbacEngine::new();
    
    // Default mock behavior for enforce
    let allowed = engine.enforce(user_id, &resource, &action);

    Ok(serde_json::json!({
        "allowed": allowed,
        "userId": user_id,
    }))
}
