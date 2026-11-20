const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { renderDashboardPage } = require('../views/dashboardView');

const router = express.Router();

// GET / (Protected)
router.get('/', requireAuth, (req, res) => {
    res.send(renderDashboardPage());
});

module.exports = router;
