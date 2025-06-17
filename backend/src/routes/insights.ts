import express from "express"
import { db } from "../db"

const router = express.Router()

router.get("/", async (_req, res) => {
  try {
    const result = await db.query(`SELECT * FROM insights WHERE date = CURRENT_DATE ORDER BY created_at DESC LIMIT 1`)

    if (result.rows.length === 0) {
      // Return mock data if no insights found
      const mockInsights = {
        id: "1",
        date: new Date().toISOString().split("T")[0],
        grade: "A",
        tips: [
          "Consider scaling database instance - memory usage at 83%",
          "Update Node.js dependencies - 3 security vulnerabilities detected",
          "Enable compression on API responses - could reduce bandwidth by 30%",
        ],
        created_at: new Date().toISOString(),
      }

      return res.json(mockInsights)
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Insights route error:", err)

    // Return mock data if database fails
    const mockInsights = {
      id: "1",
      date: new Date().toISOString().split("T")[0],
      grade: "A",
      tips: [
        "Consider scaling database instance - memory usage at 83%",
        "Update Node.js dependencies - 3 security vulnerabilities detected",
        "Enable compression on API responses - could reduce bandwidth by 30%",
      ],
      created_at: new Date().toISOString(),
    }

    res.json(mockInsights)
  }
})

// POST route to add new insights
router.post("/", async (req, res) => {
  const { grade, tips } = req.body

  try {
    const result = await db.query(
      "INSERT INTO insights (date, grade, tips, created_at) VALUES (CURRENT_DATE, $1, $2, NOW()) RETURNING *",
      [grade, tips],
    )

    res.status(201).json({
      success: true,
      insights: result.rows[0],
      message: "Insights added successfully",
    })
  } catch (err) {
    console.error("Add insights error:", err)
    res.status(500).json({
      success: false,
      error: "Failed to add insights",
    })
  }
})

export default router
