import express from 'express'
import { db } from '../db'

const router = express.Router()

// GET /api/settings
router.get('/', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings WHERE user_id = $1', ['dev-mode'])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

export default router
