const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSystemStats } = require('../services/telemetryService');
const nodeManager = require('../services/nodeManager');
const config = require('../config');

const router = express.Router();

// 1. Remote Node Telemetry Ingestion (Beacon Endpoint)
router.post('/nodes/report', (req, res) => {
    const clientToken = req.headers['x-node-token'];

    if (!clientToken || clientToken !== config.nodeIngestToken) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-node-token header' });
    }

    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const recorded = nodeManager.recordRemoteTelemetry(req.body, clientIp.split(',')[0].trim());
        return res.json({ success: true, nodeId: recorded.id, timestamp: recorded.lastSeen });
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

// 2. List all available nodes (Protected)
router.get('/nodes', requireAuth, (req, res) => {
    const remote = nodeManager.getRemoteNodesList();
    const local = {
        id: 'local',
        name: 'ARM Primary (130.210.115.179)',
        isLocal: true,
        isOnline: true
    };

    res.json({
        nodes: [local, ...remote],
        activeToken: config.nodeIngestToken
    });
});

// 3. Get specific node stats (Protected)
router.get('/nodes/:nodeId/stats', requireAuth, async (req, res) => {
    const { nodeId } = req.params;

    if (nodeId === 'local') {
        try {
            const stats = await getSystemStats();
            return res.json({
                node: {
                    id: 'local',
                    name: 'ARM Primary (130.210.115.179)',
                    isLocal: true,
                    isOnline: true
                },
                stats
            });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    const remoteNode = nodeManager.getRemoteNode(nodeId);
    if (!remoteNode) {
        return res.status(404).json({ error: 'Node not found' });
    }

    return res.json({
        node: {
            id: remoteNode.id,
            name: remoteNode.name,
            ip: remoteNode.ip,
            isLocal: false,
            isOnline: remoteNode.isOnline,
            lastSeen: remoteNode.lastSeen
        },
        stats: remoteNode.stats,
        history: remoteNode.history
    });
});

// 4. Delete remote node (Protected)
router.delete('/nodes/:nodeId', requireAuth, (req, res) => {
    const { nodeId } = req.params;
    if (nodeId === 'local') {
        return res.status(400).json({ error: 'Cannot remove primary local node' });
    }
    const removed = nodeManager.removeRemoteNode(nodeId);
    return res.json({ success: removed });
});

// 5. Primary Node Stats (Backward compatible fallback)
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = await getSystemStats();
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
