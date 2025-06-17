import express from "express"
import { db } from "../db"

const router = express.Router()

router.post("/", async (req, res) => {
  const { branch = "main", commit, summary } = req.body

  try {
    // Generate commit hash if not provided
    const commitHash = commit || Math.random().toString(36).substring(2, 9)
    const deploymentSummary = summary || `Deployment triggered from ${branch} branch`

    const result = await db.query(
      `INSERT INTO deployments (branch, commit, status, summary, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [branch, commitHash, "pending", deploymentSummary],
    )

    const deployment = result.rows[0]

    // Simulate deployment process (optional)
    setTimeout(async () => {
      const finalStatus = Math.random() > 0.2 ? "success" : "failed"
      await db.query("UPDATE deployments SET status = $1 WHERE id = $2", [finalStatus, deployment.id])
    }, 3000)

    res.status(201).json({
      success: true,
      deployment,
      message: `Deployment ${deployment.id} created successfully`,
    })
  } catch (err) {
    console.error("Deploy route error:", err)
    res.status(500).json({
      success: false,
      error: "Failed to create deployment",
    })
  }
})

export default router
