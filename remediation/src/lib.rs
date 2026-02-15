pub mod models;
use crate::models::{Incident, RemediationAction, AlertSeverity};
use anyhow::Result;

pub struct RemediationEngine;

impl RemediationEngine {
    pub fn plan(&self, incident: &Incident) -> Result<Vec<RemediationAction>> {
        let mut actions = Vec::new();

        match incident.severity {
            AlertSeverity::Critical | AlertSeverity::Disaster => {
                // If it's a critical fault in a deployment, roll back immediately
                if incident.description.contains("5xx") || incident.description.contains("crash") {
                    actions.push(RemediationAction::Rollback(incident.service_id.clone()));
                }
            }
            AlertSeverity::Warning => {
                // If it's a CPU/Memory spike, scale up
                if incident.description.contains("CPU") || incident.description.contains("Memory") {
                    actions.push(RemediationAction::ScaleUp(incident.service_id.clone(), 3));
                }
            }
        }

        Ok(actions)
    }
}
