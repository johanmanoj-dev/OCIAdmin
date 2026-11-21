const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { renderDashboardPage } = require('../views/dashboardView');
const nodeManager = require('../services/nodeManager');

const router = express.Router();

// GET / (Protected)
router.get('/', requireAuth, (req, res) => {
    nodeManager.touchDashboardActivity();
    res.send(renderDashboardPage());
});

module.exports = router;
