use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use anyhow::{Result, anyhow};

#[derive(Serialize, Deserialize, Default)]
pub struct SargeConfig {
    pub token: Option<String>,
    pub base_url: Option<String>,
}

pub fn get_config_path() -> PathBuf {
    let mut path = dirs::home_dir().expect("Could not find home directory");
    path.push(".sarge");
    if !path.exists() {
        fs::create_dir_all(&path).ok();
    }
    path.push("config.json");
    path
}

pub fn load_config() -> Result<SargeConfig> {
    let path = get_config_path();
    if !path.exists() {
        return Ok(SargeConfig::default());
    }
    let content = fs::read_to_string(path)?;
    let config: SargeConfig = serde_json::from_str(&content)?;
    Ok(config)
}

pub fn save_config(config: &SargeConfig) -> Result<()> {
    let path = get_config_path();
    let content = serde_json::to_string_pretty(config)?;
    fs::write(path, content)?;
    Ok(())
}
