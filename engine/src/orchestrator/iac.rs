use crate::models::ServiceDefinition;
use anyhow::{Result, anyhow};

pub enum IaCTarget {
    Kubernetes,
    TerraformAWS,
}

pub struct IaCTranspiler;

impl IaCTranspiler {
    pub fn transpile(target: IaCTarget, service: &ServiceDefinition) -> Result<String> {
        match target {
            IaCTarget::Kubernetes => Self::to_kubernetes(service),
            IaCTarget::TerraformAWS => Self::to_terraform_aws(service),
        }
    }

    fn to_kubernetes(service: &ServiceDefinition) -> Result<String> {
        let ports: String = service.ports.iter()
            .map(|p| format!("            - containerPort: {}", p))
            .collect::<Vec<_>>()
            .join("\n");

        let env: String = service.env.iter()
            .map(|(k, v)| format!("            - name: {}\n              value: \"{}\"", k, v))
            .collect::<Vec<_>>()
            .join("\n");

        let manifest = format!(r#"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {}
  template:
    metadata:
      labels:
        app: {}
    spec:
      containers:
        - name: {}
          image: {}
          ports:
{}
          env:
{}
"#, service.name, service.name, service.name, service.name, service.image, ports, env);

        Ok(manifest.trim().to_string())
    }

    fn to_terraform_aws(service: &ServiceDefinition) -> Result<String> {
        let tf = format!(r#"
resource "aws_ecs_task_definition" "{}" {{
  family                   = "{}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  container_definitions    = jsonencode([
    {{
      name      = "{}"
      image     = "{}"
      essential = true
      portMappings = [
        {{
          containerPort = {}
          hostPort      = {}
        }}
      ]
    }}
  ])
}}
"#, service.name, service.name, service.name, service.image, 
    service.ports.get(0).unwrap_or(&80), service.ports.get(0).unwrap_or(&80));

        Ok(tf.trim().to_string())
    }
}
