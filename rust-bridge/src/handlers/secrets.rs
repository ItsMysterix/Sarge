use serde_json::Value;
use anyhow::{Result, anyhow};
use sarge_secrets::{SecretProvider, providers::local::LocalProvider};

// In a real implementation, the provider would be a shared state
lazy_static::lazy_static! {
    static ref SECRETS_PROVIDER: LocalProvider = LocalProvider::new("sarge-master-key");
}

pub async fn get(params: Value) -> Result<Value> {
    let key = params.get("key")
        .and_then(|k| k.as_str())
        .ok_or_else(|| anyhow!("Missing 'key' parameter"))?;

    let secret = SECRETS_PROVIDER.get_secret(key).await?;

    Ok(serde_json::to_value(secret)?)
}

pub async fn set(params: Value) -> Result<Value> {
    let key = params.get("key")
        .and_then(|k| k.as_str())
        .ok_or_else(|| anyhow!("Missing 'key' parameter"))?;

    let value = params.get("value")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow!("Missing 'value' parameter"))?;

    let secret = SECRETS_PROVIDER.set_secret(key, value).await?;

    Ok(serde_json::to_value(secret)?)
}
