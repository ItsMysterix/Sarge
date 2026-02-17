use crate::models::{Action, Resource, Role};
use dashmap::DashMap;
use std::sync::Arc;
use anyhow::{Result, anyhow};

pub struct RbacEngine {
    roles: Arc<DashMap<String, Role>>,
    user_roles: Arc<DashMap<String, Vec<String>>>,
}

impl RbacEngine {
    pub fn new() -> Self {
        Self {
            roles: Arc::new(DashMap::new()),
            user_roles: Arc::new(DashMap::new()),
        }
    }

    pub fn add_role(&self, role: Role) {
        self.roles.insert(role.name.clone(), role);
    }

    pub fn assign_role(&self, user_id: &str, role_name: &str) -> Result<()> {
        if !self.roles.contains_key(role_name) {
            return Err(anyhow!("Role {} does not exist", role_name));
        }

        let mut roles = self.user_roles.entry(user_id.to_string()).or_insert(Vec::new());
        if !roles.contains(&role_name.to_string()) {
            roles.push(role_name.to_string());
        }
        Ok(())
    }

    pub fn enforce(&self, user_id: &str, resource: &Resource, action: &Action) -> bool {
        let user_roles = match self.user_roles.get(user_id) {
            Some(r) => r,
            None => return false,
        };

        for role_name in user_roles.value() {
            if let Some(role) = self.roles.get(role_name) {
                if role.permissions.contains(&(resource.clone(), action.clone())) {
                    return true;
                }
                // Special check for Manage action which grants everything for that resource
                if role.permissions.contains(&(resource.clone(), Action::Manage)) {
                    return true;
                }
            }
        }

        false
    }
}
