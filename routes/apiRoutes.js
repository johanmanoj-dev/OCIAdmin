const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSystemStats } = require('../services/telemetryService');

const router = express.Router();

// GET /api/stats (Protected)
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = await getSystemStats();
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
