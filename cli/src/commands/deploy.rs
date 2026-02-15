use crate::utils::config::load_config;
use crate::utils::api::ApiClient;
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use indicatif::{ProgressBar, ProgressStyle};

#[derive(Serialize)]
struct DeployInput {
    repo_path: String,
    provider: Option<String>,
    environment: String,
}

#[derive(Deserialize)]
struct DeployResult {
    success: bool,
    deployment_id: String,
    metadata: serde_json::Value,
}

pub async fn run(provider: Option<String>, env: String) -> Result<()> {
    let config = load_config()?;
    let token = config.token.ok_or_else(|| anyhow!("Not authenticated. Run 'sarge auth' first."))?;
    let base_url = config.base_url.unwrap_or_else(|| "http://localhost:3000/api/trpc".to_string());
    
    let api = ApiClient::new(base_url, Some(token));
    
    println!("Preparing deployment for current directory...");
    let pb = ProgressBar::new_spinner();
    pb.set_style(ProgressStyle::default_spinner()
        .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈")
        .template("{spinner:.blue} {msg}")?);
    
    pb.set_message("Uploading and triggering deployment...");

    let res: DeployResult = api.call("oneclick.deploy", &DeployInput {
        repo_path: ".".to_string(),
        provider,
        environment: env,
    }).await?;

    if res.success {
        pb.finish_with_message(format!("Deployment triggered! ID: {}", res.deployment_id));
        println!("Metadata: {:?}", res.metadata);
    } else {
        pb.abandon();
        return Err(anyhow!("Deployment failed"));
    }

    Ok(())
}
