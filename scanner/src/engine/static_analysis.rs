use crate::models::{Vulnerability, Severity};
use anyhow::Result;
use regex::Regex;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

pub fn scan_directory(root: &Path) -> Result<Vec<Vulnerability>> {
    let mut vulnerabilities = Vec::new();

    // Patterns for secrets and insecure configs
    let patterns = vec![
        (
            Regex::new(r"(?i)api_key\s*[:=]\s*['"r"]([A-Z0-9]{20,})['"r"]")?,
            "Hardcoded API Key",
            Severity::High,
            "Potential hardcoded secret detected. Use environment variables instead.",
        ),
        (
            Regex::new(r"(?i)postgres://\w+:.+@.+:\d+/\w+")?,
            "Hardcoded Database URI",
            Severity::Critical,
            "Credentials found in connection string. Move to encrypted secrets store.",
        ),
        (
            Regex::new(r"FROM\s+.+:(latest|nightly)")?,
            "Unpinned Docker Image",
            Severity::Medium,
            "Using 'latest' tag can lead to non-deterministic builds. Use specific versions or digests.",
        ),
    ];

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();
        
        // Skip common large/binary directories
        if path.to_string_lossy().contains("node_modules") || 
           path.to_string_lossy().contains(".git") ||
           path.to_string_lossy().contains("target") {
            continue;
        }

        if let Ok(content) = fs::read_to_string(path) {
            for (regex, title, severity, suggestion) in &patterns {
                for (ln_idx, line) in content.lines().enumerate() {
                    if regex.is_match(line) {
                        vulnerabilities.push(Vulnerability {
                            id: format!("SEC-{}", uuid::Uuid::new_v4()),
                            title: title.to_string(),
                            description: format!("Pattern matched in line {}", ln_idx + 1),
                            severity: severity.clone(),
                            file: path.to_string_lossy().to_string(),
                            line: Some(ln_idx + 1),
                            suggestion: suggestion.to_string(),
                        });
                    }
                }
            }
        }
    }

    Ok(vulnerabilities)
}
