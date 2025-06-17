// Test script to verify all API endpoints work with Neon
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

async function testEndpoint(name: string, url: string, options?: RequestInit) {
  try {
    console.log(`🧪 Testing ${name}...`)
    const response = await fetch(`${API_BASE}${url}`, options)
    const data = await response.json()

    if (response.ok) {
      console.log(`✅ ${name} - Success`)
      console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`)
    } else {
      console.log(`❌ ${name} - Failed`)
      console.log(`   Error: ${data.error || "Unknown error"}`)
    }
  } catch (error) {
    console.log(`❌ ${name} - Network Error`)
    console.log(`   ${error}`)
  }
  console.log("")
}

async function runTests() {
  console.log("🚀 Testing Sarge API Endpoints with Neon Database\n")

  // Test GET endpoints
  await testEndpoint("Metrics", "/metrics")
  await testEndpoint("Logs", "/logs")
  await testEndpoint("Logs (Error Filter)", "/logs?type=error")
  await testEndpoint("Deployments", "/deployments")
  await testEndpoint("Insights", "/insights")
  await testEndpoint("Services", "/services")
  await testEndpoint("Settings", "/settings")

  // Test POST endpoints
  await testEndpoint("Add Metric", "/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cpu_usage: 75.5,
      memory_usage: 82.1,
      latency_ms: 48,
      cost_daily: 93.25,
    }),
  })

  await testEndpoint("Add Log", "/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "info",
      message: "Test log entry from API test script",
      service: "test-service",
      severity: "low",
    }),
  })

  await testEndpoint("Create Deployment", "/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branch: "test-branch",
      commit: "abc123",
      summary: "Test deployment from API script",
      author: "Test Script",
    }),
  })

  console.log("🏁 API Testing Complete!")
}

// Run tests if this script is executed directly
if (typeof window === "undefined") {
  runTests()
}

export { runTests }
