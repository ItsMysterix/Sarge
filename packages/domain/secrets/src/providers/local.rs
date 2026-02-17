use crate::{Secret, SecretProvider};
use async_trait::async_trait;
use anyhow::{Result, anyhow};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce, Key
};
use rand::{Rng, thread_rng};
use std::collections::HashMap;
use std::sync::Mutex;

pub struct LocalProvider {
    key: Key<Aes256Gcm>,
    storage: Mutex<HashMap<String, Vec<u8>>>,
}

impl LocalProvider {
    pub fn new(passphrase: &str) -> Self {
        // In a real implementation, derive key from passphrase using Argon2
        let mut key_bytes = [0u8; 32];
        let bytes = passphrase.as_bytes();
        let len = bytes.len().min(32);
        key_bytes[..len].copy_from_slice(&bytes[..len]);
        
        let key = *Key::<Aes256Gcm>::from_slice(&key_bytes);
        Self {
            key,
            storage: Mutex::new(HashMap::new()),
        }
    }
}

#[async_trait]
impl SecretProvider for LocalProvider {
    async fn get_secret(&self, key: &str) -> Result<Secret> {
        let storage = self.storage.lock().map_err(|_| anyhow!("Storage lock poisoned"))?;
        let encrypted_data = storage.get(key).ok_or_else(|| anyhow!("Secret not found"))?;

        let cipher = Aes256Gcm::new(&self.key);
        let nonce = Nonce::from_slice(&encrypted_data[..12]);
        let ciphertext = &encrypted_data[12..];

        let decrypted = cipher.decrypt(nonce, ciphertext)
            .map_err(|_| anyhow!("Decryption failed"))?;

        Ok(Secret {
            key: key.to_string(),
            value: String::from_utf8(decrypted)?,
            version: Some("v1".to_string()),
            provider: "local".to_string(),
        })
    }

    async fn set_secret(&self, key: &str, value: &str) -> Result<Secret> {
        let cipher = Aes256Gcm::new(&self.key);
        let mut nonce_bytes = [0u8; 12];
        thread_rng().fill(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, value.as_bytes())
            .map_err(|_| anyhow!("Encryption failed"))?;

        let mut data = Vec::with_capacity(12 + ciphertext.len());
        data.extend_from_slice(&nonce_bytes);
        data.extend_from_slice(&ciphertext);

        let mut storage = self.storage.lock().map_err(|_| anyhow!("Storage lock poisoned"))?;
        storage.insert(key.to_string(), data);

        Ok(Secret {
            key: key.to_string(),
            value: value.to_string(),
            version: Some("v1".to_string()),
            provider: "local".to_string(),
        })
    }

    async fn delete_secret(&self, key: &str) -> Result<()> {
        let mut storage = self.storage.lock().map_err(|_| anyhow!("Storage lock poisoned"))?;
        storage.remove(key);
        Ok(())
    }
}
