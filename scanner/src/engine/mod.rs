pub mod static_analysis;

use crate::models::{Vulnerability, ScanReport, ScanSummary};
use anyhow::Result;
use chrono::Utc;
use std::path::Path;

pub struct ScannerEngine {
    pub target_path: String,
}

impl ScannerEngine {
    pub fn new(target_path: String) -> Self {
        Self { target_path }
    }

    pub async fn run(&self) -> Result<ScanReport> {
        let path = Path::new(&self.target_path);
        let mut vulnerabilities = Vec::new();

        // Perform static analysis
        let static_vulns = static_analysis::scan_directory(path)?;
        vulnerabilities.extend(static_vulns);

        let summary = self.calculate_summary(&vulnerabilities);

        Ok(ScanReport {
            scan_time: Utc::now(),
            target: self.target_path.clone(),
            vulnerabilities,
            summary,
        })
    }

    fn calculate_summary(&self, vulnerabilities: &[Vulnerability]) -> ScanSummary {
        let mut critical = 0;
        let mut high = 0;
        let mut medium = 0;
        let mut low = 0;

        for v in vulnerabilities {
            match v.severity {
                crate::models::Severity::Critical => critical += 1,
                crate::models::Severity::High => high += 1,
                crate::models::Severity::Medium => medium += 1,
                crate::models::Severity::Low => low += 1,
            }
        }

        ScanSummary {
            total: vulnerabilities.len(),
            critical,
            high,
            medium,
            low,
        }
    }
}
