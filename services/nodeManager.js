// In-Memory Multi-Node Registry & Telemetry Store
const remoteNodes = new Map();

const MAX_HISTORY = 24; // ~2 minutes of rolling history at 5s intervals
const OFFLINE_THRESHOLD_MS = 45000; // 45 seconds without beacon marks node offline
const VIEWER_TIMEOUT_MS = 12000; // 12 seconds inactivity means no viewer on dashboard

let lastDashboardActivity = 0;

function formatSpeed(bytesPerSec) {
    const n = parseFloat(bytesPerSec) || 0;
    if (n <= 0) return '0 B/s';
    if (n < 1024) return n.toFixed(0) + ' B/s';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB/s';
    return (n / (1024 * 1024)).toFixed(1) + ' MB/s';
}

function formatBytes(bytes) {
    const n = parseFloat(bytes) || 0;
    if (n <= 0) return '0 B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function touchDashboardActivity() {
    lastDashboardActivity = Date.now();
}

function isDashboardActive() {
    return (Date.now() - lastDashboardActivity) < VIEWER_TIMEOUT_MS;
}

function normalizeRemoteContainers(incoming, fallback) {
    if (incoming && typeof incoming === 'object' && Array.isArray(incoming.items)) {
        return {
            status: String(incoming.status || 'ok'),
            error: String(incoming.error || ''),
            items: incoming.items.map(c => {
                const commitFull = String(c.commitFull || c.commit || '').trim();
                const commit = String(c.commit || (commitFull ? commitFull.slice(0, 7) : '')).trim();
                const id = String(c.id || '').slice(0, 12);
                const startedAt = (c.startedAt && !String(c.startedAt).startsWith('0001-01-01')) ? String(c.startedAt) : '';
                const createdAt = (c.createdAt && !String(c.createdAt).startsWith('0001-01-01')) ? String(c.createdAt) : '';
                const rebuiltAt = (c.rebuiltAt && !String(c.rebuiltAt).startsWith('0001-01-01')) ? String(c.rebuiltAt) : '';

                return {
                    id,
                    name: String(c.name || id).replace(/^\/+/, ''),
                    image: String(c.image || ''),
                    state: String(c.state || 'unknown'),
                    statusText: String(c.statusText || c.state || 'unknown'),
                    health: String(c.health || 'none'),
                    healthFailingStreak: Number(c.healthFailingStreak) || 0,
                    healthLog: String(c.healthLog || ''),
                    restartCount: Number(c.restartCount) || 0,
                    ports: String(c.ports || ''),
                    createdAt,
                    startedAt,
                    rebuiltAt,
                    composeProject: String(c.composeProject || ''),
                    composeService: String(c.composeService || ''),
                    commit,
                    commitFull,
                    commitMessage: String(c.commitMessage || ''),
                    commitBranch: String(c.commitBranch || ''),
                    commitSource: String(c.commitSource || (commit ? 'oci-label' : 'none')),
                    repoUrl: String(c.repoUrl || '')
                };
            })
        };
    }

    if (fallback && typeof fallback === 'object' && Array.isArray(fallback.items)) {
        return fallback;
    }

    return { status: 'unavailable', error: '', items: [] };
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
            uptimeHours = '0.0',
            rxSec = 0,
            txSec = 0,
            rxTotal = 0,
            txTotal = 0
        } = payload;

        const memNum = parseFloat(memPercent) || 0;
        const cpuNum = parseFloat(cpuPercent) || 0;
        const rxNum = parseInt(rxSec, 10) || 0;
        const txNum = parseInt(txSec, 10) || 0;

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
            pgStatus: payload.pgStatus || 'N/A',
            rxSec: rxNum,
            txSec: txNum,
            rxRateStr: payload.rxRateStr || formatSpeed(rxNum),
            txRateStr: payload.txRateStr || formatSpeed(txNum),
            rxTotalStr: payload.rxTotalStr || formatBytes(rxTotal),
            txTotalStr: payload.txTotalStr || formatBytes(txTotal),
            processes: payload.processes || { byCpu: [], byMem: [] },
            devStack: (Array.isArray(payload.devStack) && payload.devStack.length > 0)
                ? payload.devStack
                : (existing.stats && Array.isArray(existing.stats.devStack) ? existing.stats.devStack : []),
            containers: normalizeRemoteContainers(payload.containers, existing.stats?.containers)
        };

        // Maintain in-memory time-series history
        existing.history.mem.push(memNum);
        if (existing.history.mem.length > MAX_HISTORY) existing.history.mem.shift();

        existing.history.cpu.push(cpuNum);
        if (existing.history.cpu.length > MAX_HISTORY) existing.history.cpu.shift();

        existing.history.netRx = existing.history.netRx || [];
        existing.history.netTx = existing.history.netTx || [];
        existing.history.netRx.push(rxNum);
        if (existing.history.netRx.length > MAX_HISTORY) existing.history.netRx.shift();

        existing.history.netTx.push(txNum);
        if (existing.history.netTx.length > MAX_HISTORY) existing.history.netTx.shift();
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
