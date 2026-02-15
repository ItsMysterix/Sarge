use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vulnerability {
    pub id: String,
    pub title: String,
    pub description: String,
    pub severity: Severity,
    pub file: String,
    pub line: Option<usize>,
    pub suggestion: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanReport {
    pub scan_time: DateTime<Utc>,
    pub target: String,
    pub vulnerabilities: Vec<Vulnerability>,
    pub summary: ScanSummary,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanSummary {
    pub total: usize,
    pub critical: usize,
    pub high: usize,
    pub medium: usize,
    pub low: usize,
}
