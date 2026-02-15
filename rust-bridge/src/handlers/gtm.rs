use serde_json::Value;
use anyhow::{Result, anyhow};
use sarge_gtm::GtmEngine;
use sarge_gtm::models::GtmPolicy;

pub async fn handle(params: Value) -> Result<Value> {
    let policy: GtmPolicy = serde_json::from_value(params.clone())?;
    
    let endpoint = GtmEngine::resolve(&policy)?;

    Ok(serde_json::to_value(endpoint)?)
}
