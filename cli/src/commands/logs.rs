use crate::utils::config::load_config;
use crate::utils::api::ApiClient;
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct LogsInput {
    deployment: String,
    tail: u32,
}

#[derive(Deserialize)]
struct LogEntry {
    timestamp: String,
    message: String,
    provider: String,
}

pub async fn run(deployment: String, tail: u32) -> Result<()> {
    let config = load_config()?;
    let token = config.token.ok_or_else(|| anyhow!("Not authenticated. Run 'sarge auth' first."))?;
    let base_url = config.base_url.unwrap_or_else(|| "http://localhost:3000/api/trpc".to_string());
    
    let api = ApiClient::new(base_url, Some(token));
    
    let logs: Vec<LogEntry> = api.call("logs.tail", &LogsInput {
        deployment: deployment.clone(),
        tail,
    }).await?;

    for entry in logs {
        println!("[{}] {}", entry.timestamp, entry.message);
    }

    Ok(())
}
