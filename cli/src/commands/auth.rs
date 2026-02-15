use crate::utils::config::{SargeConfig, save_config, load_config};
use crate::utils::api::ApiClient;
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct LoginInput {
    token: String,
}

#[derive(Deserialize)]
struct LoginResult {
    success: bool,
    user: String,
}

pub async fn run(token: Option<String>) -> Result<()> {
    let mut config = load_config()?;
    
    let actual_token = match token {
        Some(t) => t,
        None => {
            println!("Enter your API token (find it in the Sarge Dashboard): ");
            let mut input = String::new();
            std::io::stdin().read_line(&mut input)?;
            input.trim().to_string()
        }
    };

    if actual_token.is_empty() {
        return Err(anyhow!("Token cannot be empty"));
    }

    let base_url = config.base_url.clone().unwrap_or_else(|| "http://localhost:3000/api/trpc".to_string());
    let api = ApiClient::new(base_url.clone(), Some(actual_token.clone()));

    println!("Verifying token...");
    let result: LoginResult = api.call("user.verifyToken", &LoginInput { token: actual_token.clone() }).await?;

    if result.success {
        config.token = Some(actual_token);
        config.base_url = Some(base_url);
        save_config(&config)?;
        println!("Successfully authenticated as {}!", result.user);
    } else {
        return Err(anyhow!("Invalid token"));
    }

    Ok(())
}
