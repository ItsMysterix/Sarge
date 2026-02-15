use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::*;

mod commands;
mod utils;

#[derive(Parser)]
#[command(name = "sarge")]
#[command(about = "High-performance CLI for SARGE cloud deployments", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate with the Sarge backend
    Auth {
        /// API Token
        #[arg(short, long)]
        token: Option<string>,
    },
    /// Deploy the current directory to a cloud provider
    Deploy {
        /// Target provider (e.g., vercel, railway, kubernetes)
        #[arg(short, long)]
        provider: Option<string>,
        /// Environment (preview, staging, production)
        #[arg(short, long, default_value = "preview")]
        env: string,
    },
    /// Stream logs for a specific deployment
    Logs {
        /// Deployment ID or Service name
        deployment: string,
        /// Number of lines to tail
        #[arg(short, long, default_value_t = 50)]
        tail: u32,
    },
    /// Get the status of a deployment
    Status {
        /// Deployment ID
        deployment: string,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Auth { token } => {
            commands::auth::run(token).await?;
        }
        Commands::Deploy { provider, env } => {
            commands::deploy::run(provider, env).await?;
        }
        Commands::Logs { deployment, tail } => {
            commands::logs::run(deployment, tail).await?;
        }
        Commands::Status { deployment } => {
            commands::status::run(deployment).await?;
        }
    }

    Ok(())
}
