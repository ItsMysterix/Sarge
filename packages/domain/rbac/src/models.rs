use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Serialize, Deserialize, Clone, Hash, Eq, PartialEq)]
pub enum Action {
    Create,
    Read,
    Update,
    Delete,
    Manage,
}

#[derive(Debug, Serialize, Deserialize, Clone, Hash, Eq, PartialEq)]
pub enum Resource {
    Project(String),
    Deployment(String),
    Infrastructure,
    Settings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Policy {
    pub subject: String, // User ID or Role
    pub object: Resource,
    pub action: Action,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Role {
    pub name: String,
    pub permissions: HashSet<(Resource, Action)>,
}
