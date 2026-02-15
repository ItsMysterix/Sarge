use anyhow::Result;
use sarge_scanner::engine::ScannerEngine;
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    let target = args.get(1).cloned().unwrap_or_else(|| ".".to_string());

    println!("➜ Scanning target: {}", target);

    let engine = ScannerEngine::new(target);
    let report = engine.run().await?;

    println!("\n=== Scan Report ===");
    println!("Time:     {}", report.scan_time);
    println!("Target:   {}", report.target);
    println!("Vulnerabilities found: {}", report.summary.total);
    
    if report.vulnerabilities.is_empty() {
        println!("✅ No vulnerabilities found!");
    } else {
        for v in &report.vulnerabilities {
            println!("\n-- {} [{:?}] --", v.title, v.severity);
            println!("File:      {}:{:?}", v.file, v.line.unwrap_or(0));
            println!("Summary:   {}", v.description);
            println!("Recommend: {}", v.suggestion);
        }

        println!("\n=== Summary ===");
        println!("Critical: {}", report.summary.critical);
        println!("High:     {}", report.summary.high);
        println!("Medium:   {}", report.summary.medium);
        println!("Low:      {}", report.summary.low);
    }

    Ok(())
}
