use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use anyhow::Result;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Secret {
    pub key: String,
    pub value: String,
    pub version: Option<String>,
    pub provider: String,
}

#[async_trait]
pub trait SecretProvider: Send + Sync {
    async fn get_secret(&self, key: &str) -> Result<Secret>;
    async fn set_secret(&self, key: &str, value: &str) -> Result<Secret>;
    async fn delete_secret(&self, key: &str) -> Result<()>;
}

pub mod providers {
    pub mod local;
}

