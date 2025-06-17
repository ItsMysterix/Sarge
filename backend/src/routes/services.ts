import express from 'express'
import { db } from '../db'

const router = express.Router()

// GET /api/services
router.get('/', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY name ASC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching services:', error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

export default router
