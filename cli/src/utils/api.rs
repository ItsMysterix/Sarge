use anyhow::{Result, anyhow};
use reqwest::{Client,header};
use serde::{Deserialize, Serialize};

pub struct ApiClient {
    client: Client,
    base_url: String,
    token: Option<String>,
}

impl ApiClient {
    pub fn new(base_url: String, token: Option<String>) -> Self {
        let mut headers = header::HeaderMap::new();
        if let Some(ref t) = token {
            headers.insert(
                header::AUTHORIZATION,
                header::HeaderValue::from_str(&format!("Bearer {}", t)).unwrap(),
            );
        }

        let client = Client::builder()
            .default_headers(headers)
            .build()
            .unwrap();

        Self { client, base_url, token }
    }

    /// Call a tRPC procedure (query or mutation)
    pub async fn call<I, O>(&self, path: &str, input: &I) -> Result<O>
    where
        I: Serialize,
        O: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/{}", self.base_url, path);
        let response = self.client.post(&url)
            .json(input)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("tRPC request failed ({}): {}", url, error_text));
        }

        let result: O = response.json().await?;
        Ok(result)
    }
}
