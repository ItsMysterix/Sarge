use crate::utils::config::load_config;
use crate::utils::api::ApiClient;
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct StatusInput {
    deployment: String,
}

#[derive(Deserialize)]
struct StatusResult {
    status: String,
    progress: u32,
    message: String,
}

pub async fn run(deployment: String) -> Result<()> {
    let config = load_config()?;
    let token = config.token.ok_or_else(|| anyhow!("Not authenticated. Run 'sarge auth' first."))?;
    let base_url = config.base_url.unwrap_or_else(|| "http://localhost:3000/api/trpc".to_string());
    
    let api = ApiClient::new(base_url, Some(token));
    
    let res: StatusResult = api.call("oneclick.getStatus", &StatusInput {
        deployment: deployment.clone(),
    }).await?;

    println!("Deployment: {}", deployment);
    println!("Status:     {}", res.status);
    println!("Progress:   {}%", res.progress);
    println!("Message:    {}", res.message);

    Ok(())
}
