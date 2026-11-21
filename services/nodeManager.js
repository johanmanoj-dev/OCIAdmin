// In-Memory Multi-Node Registry & Telemetry Store
const remoteNodes = new Map();

const MAX_HISTORY = 24; // ~2 minutes of rolling history at 5s intervals
const OFFLINE_THRESHOLD_MS = 45000; // 45 seconds without beacon marks node offline
const VIEWER_TIMEOUT_MS = 12000; // 12 seconds inactivity means no viewer on dashboard

let lastDashboardActivity = 0;

function touchDashboardActivity() {
    lastDashboardActivity = Date.now();
}

function isDashboardActive() {
    return (Date.now() - lastDashboardActivity) < VIEWER_TIMEOUT_MS;
}

function recordRemoteTelemetry(payload, clientIp = '') {
    if (!payload || !payload.nodeId) {
        throw new Error('Invalid payload: nodeId is required');
    }

    const {
        nodeId,
        name = nodeId,
        standby = false
    } = payload;

    const existing = remoteNodes.get(nodeId) || {
        id: nodeId,
        name,
        ip: clientIp,
        firstSeen: Date.now(),
        history: {
            mem: [],
            cpu: []
        },
        stats: null
    };

    existing.name = name;
    if (clientIp) existing.ip = clientIp;
    existing.lastSeen = Date.now();
    existing.isStandby = Boolean(standby);

    if (!standby) {
        const {
            memPercent = 0,
            memUsedMB = 0,
            memTotalMB = 0,
            cpuPercent = 0,
            diskTotalGB = '0.0',
            diskUsedGB = '0.0',
            diskFreeGB = '0.0',
            diskUsedPercent = '0.0',
            diskFreePercent = '0.0',
            uptimeHours = '0.0'
        } = payload;

        const memNum = parseFloat(memPercent) || 0;
        const cpuNum = parseFloat(cpuPercent) || 0;

        existing.stats = {
            memPercent: memNum.toFixed(1),
            memUsedMB: parseInt(memUsedMB, 10) || 0,
            memTotalMB: parseInt(memTotalMB, 10) || 0,
            cpuPercent: cpuNum.toFixed(1),
            diskTotalGB: String(diskTotalGB),
            diskUsedGB: String(diskUsedGB),
            diskFreeGB: String(diskFreeGB),
            diskUsedPercent: String(diskUsedPercent),
            diskFreePercent: String(diskFreePercent),
            uptimeHours: String(uptimeHours),
            pgStatus: payload.pgStatus || 'N/A'
        };

        // Maintain in-memory time-series history
        existing.history.mem.push(memNum);
        if (existing.history.mem.length > MAX_HISTORY) existing.history.mem.shift();

        existing.history.cpu.push(cpuNum);
        if (existing.history.cpu.length > MAX_HISTORY) existing.history.cpu.shift();
    }

    remoteNodes.set(nodeId, existing);
    const active = isDashboardActive();
    return {
        node: existing,
        active,
        interval: active ? 3 : 15
    };
}

function getRemoteNodesList() {
    const now = Date.now();
    const list = [];
    const active = isDashboardActive();

    for (const [id, node] of remoteNodes.entries()) {
        const isOnline = (now - node.lastSeen) < OFFLINE_THRESHOLD_MS;
        list.push({
            id: node.id,
            name: node.name,
            ip: node.ip,
            isLocal: false,
            isOnline,
            isStandby: node.isStandby && !active,
            lastSeen: node.lastSeen,
            stats: node.stats
        });
    }

    return list;
}

function getRemoteNode(nodeId) {
    const node = remoteNodes.get(nodeId);
    if (!node) return null;

    const now = Date.now();
    const isOnline = (now - node.lastSeen) < OFFLINE_THRESHOLD_MS;
    const active = isDashboardActive();

    return {
        ...node,
        isOnline,
        isStandby: node.isStandby && !active
    };
}

function removeRemoteNode(nodeId) {
    return remoteNodes.delete(nodeId);
}

module.exports = {
    recordRemoteTelemetry,
    getRemoteNodesList,
    getRemoteNode,
    removeRemoteNode,
    touchDashboardActivity,
    isDashboardActive
};
