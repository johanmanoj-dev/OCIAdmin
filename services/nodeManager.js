// In-Memory Multi-Node Registry & Telemetry Store
const remoteNodes = new Map();

const MAX_HISTORY = 24; // ~2 minutes of rolling history at 5s intervals
const OFFLINE_THRESHOLD_MS = 20000; // 20 seconds without beacon marks node offline

function recordRemoteTelemetry(payload, clientIp = '') {
    if (!payload || !payload.nodeId) {
        throw new Error('Invalid payload: nodeId is required');
    }

    const {
        nodeId,
        name = nodeId,
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

    const existing = remoteNodes.get(nodeId) || {
        id: nodeId,
        name,
        ip: clientIp,
        firstSeen: Date.now(),
        history: {
            mem: [],
            cpu: []
        }
    };

    const memNum = parseFloat(memPercent) || 0;
    const cpuNum = parseFloat(cpuPercent) || 0;

    existing.name = name;
    if (clientIp) existing.ip = clientIp;
    existing.lastSeen = Date.now();
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

    remoteNodes.set(nodeId, existing);
    return existing;
}

function getRemoteNodesList() {
    const now = Date.now();
    const list = [];

    for (const [id, node] of remoteNodes.entries()) {
        const isOnline = (now - node.lastSeen) < OFFLINE_THRESHOLD_MS;
        list.push({
            id: node.id,
            name: node.name,
            ip: node.ip,
            isLocal: false,
            isOnline,
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

    return {
        ...node,
        isOnline
    };
}

function removeRemoteNode(nodeId) {
    return remoteNodes.delete(nodeId);
}

module.exports = {
    recordRemoteTelemetry,
    getRemoteNodesList,
    getRemoteNode,
    removeRemoteNode
};
