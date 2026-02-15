use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum RemediationAction {
    Rollback(String), // Deployment ID
    ScaleUp(String, u32), // Service ID, Replicas
    Restart(String), // Service ID
    Halt(String), // Service ID
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AlertSeverity {
    Warning,
    Critical,
    Disaster,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Incident {
    pub id: String,
    pub severity: AlertSeverity,
    pub service_id: String,
    pub description: String,
}
