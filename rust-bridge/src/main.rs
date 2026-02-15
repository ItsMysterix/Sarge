use axum::{
    routing::{post},
    Router,
    Json,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use serde_json::Value;

mod handlers;

#[tokio::main]
async fn main() {
    // Initialize tracking for engine/scanner if needed
    
    let app = Router::new()
        .route("/rpc", post(rpc_handler))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    println!("➜ Sarge Rust Bridge listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn rpc_handler(Json(payload): Json<Value>) -> Json<Value> {
    let method = payload.get("method").and_then(|m| m.as_str()).unwrap_or("unknown");
    let params = payload.get("params").cloned().unwrap_or(Value::Null);

    let result = match method {
        "scan.vulnerability" => handlers::scan::handle(params).await,
        "iac.generate" => handlers::iac::handle(params).await,
        "rbac.enforce" => handlers::rbac::handle(params).await,
        "secrets.get" => handlers::secrets::get(params).await,
        "secrets.set" => handlers::secrets::set(params).await,
        "gtm.resolve" => handlers::gtm::handle(params).await,
        "remediation.plan" => handlers::remediation::handle(params).await,
        _ => Err(anyhow::anyhow!("Method not found")),
    };

    match result {
        Ok(data) => Json(serde_json::json!({ "jsonrpc": "2.0", "result": data, "id": payload.get("id") })),
        Err(e) => Json(serde_json::json!({ "jsonrpc": "2.0", "error": { "code": -32603, "message": e.to_string() }, "id": payload.get("id") })),
    }
}
