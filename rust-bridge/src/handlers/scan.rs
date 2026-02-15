use serde_json::Value;
use anyhow::{Result, anyhow};
use sarge_scanner::engine::ScannerEngine;

pub async fn handle(params: Value) -> Result<Value> {
    let target = params.get("target")
        .and_then(|t| t.as_str())
        .ok_or_else(|| anyhow!("Missing 'target' parameter"))?;

    let engine = ScannerEngine::new(target.to_string());
    let report = engine.run().await?;

    Ok(serde_json::to_value(report)?)
}
