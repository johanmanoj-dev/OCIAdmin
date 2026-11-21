const fs = require('fs');
const si = require('systeminformation');
const { execSync } = require('child_process');

let prevNetSample = {
    time: 0,
    rxBytes: 0,
    txBytes: 0
};

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

async function getNetworkMetrics() {
    let rxTotal = 0;
    let txTotal = 0;

    // Fast Linux /proc/net/dev reader (< 0.1ms)
    if (process.platform === 'linux' && fs.existsSync('/proc/net/dev')) {
        try {
            const raw = fs.readFileSync('/proc/net/dev', 'utf8');
            for (const line of raw.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed.includes(':') || trimmed.startsWith('lo:')) continue;
                const parts = trimmed.split(':')[1].trim().split(/\s+/);
                rxTotal += parseInt(parts[0], 10) || 0;
                txTotal += parseInt(parts[8], 10) || 0;
            }
        } catch {
            // fallback
        }
    }

    // Windows or non-proc fallback
    if (rxTotal === 0 && txTotal === 0) {
        try {
            const stats = await si.networkStats();
            if (Array.isArray(stats)) {
                for (const iface of stats) {
                    if (iface.operstate === 'up' && iface.iface !== 'lo') {
                        rxTotal += iface.rx_bytes || 0;
                        txTotal += iface.tx_bytes || 0;
                    }
                }
            }
        } catch {
            // fallback
        }
    }

    const now = Date.now();
    let rxSec = 0;
    let txSec = 0;

    if (prevNetSample.time > 0 && now > prevNetSample.time && rxTotal >= prevNetSample.rxBytes) {
        const deltaSec = (now - prevNetSample.time) / 1000;
        if (deltaSec > 0.5) {
            rxSec = Math.round((rxTotal - prevNetSample.rxBytes) / deltaSec);
            txSec = Math.round((txTotal - prevNetSample.txBytes) / deltaSec);
        }
    }

    if (rxTotal > 0 || txTotal > 0) {
        prevNetSample = { time: now, rxBytes: rxTotal, txBytes: txTotal };
    }

    return {
        rxSec,
        txSec,
        rxRateStr: formatSpeed(rxSec),
        txRateStr: formatSpeed(txSec),
        rxTotalStr: formatBytes(rxTotal),
        txTotalStr: formatBytes(txTotal)
    };
}

async function getSystemStats() {
    const mem = await si.mem();
    const cpu = await si.currentLoad();
    const disk = await si.fsSize();
    const time = si.time();
    const net = await getNetworkMetrics();

    let pgStatus = 'Offline';
    try {
        execSync('pg_isready -q', { timeout: 1000, stdio: 'ignore' });
        pgStatus = 'Online';
    } catch {
        pgStatus = 'Offline';
    }

    const memUsedMB = Math.round(mem.active / 1024 / 1024);
    const memTotalMB = Math.round(mem.total / 1024 / 1024);
    const memPercent = ((memUsedMB / memTotalMB) * 100).toFixed(1);

    // Filter out virtual, snap, and loop pseudo-filesystems to inspect real physical disk storage
    const isVirtual = (d) => {
        if (!d || !d.size) return true;
        if (d.fs && d.fs.startsWith('/dev/loop')) return true;
        if (d.mount && d.mount.startsWith('/snap')) return true;
        const vTypes = ['squashfs', 'tmpfs', 'devtmpfs', 'overlay', 'iso9660', 'efivarfs', 'udev'];
        if (d.type && vTypes.includes(d.type.toLowerCase())) return true;
        return false;
    };

    const physicalDisks = (disk || []).filter(d => !isVirtual(d));
    const rootFs = (disk || []).find(d => d.mount === '/' || d.mount === 'C:' || d.mount === 'C:\\');

    let totalBytes = 0;
    let usedBytes = 0;
    let availableBytes = 0;

    if (physicalDisks.length > 0) {
        totalBytes = physicalDisks.reduce((sum, d) => sum + (d.size || 0), 0);
        usedBytes = physicalDisks.reduce((sum, d) => sum + (d.used || 0), 0);
        availableBytes = physicalDisks.reduce((sum, d) => sum + (d.available || 0), 0);
    } else if (rootFs) {
        totalBytes = rootFs.size || 0;
        usedBytes = rootFs.used || 0;
        availableBytes = rootFs.available || 0;
    }

    // Direct OS statvfs fallback on Linux if systeminformation reported 0
    if ((totalBytes === 0 || availableBytes === 0) && process.platform !== 'win32') {
        try {
            const dfOut = execSync('df -B1 /', { timeout: 1500 }).toString().trim().split('\n');
            if (dfOut.length >= 2) {
                const parts = dfOut[1].trim().split(/\s+/);
                if (parts.length >= 6) {
                    totalBytes = parseInt(parts[1], 10) || totalBytes;
                    usedBytes = parseInt(parts[2], 10) || usedBytes;
                    availableBytes = parseInt(parts[3], 10) || availableBytes;
                }
            }
        } catch (e) {
            // fallback ignore
        }
    }

    const diskTotalGB = (totalBytes / (1024 ** 3)).toFixed(1);
    const diskUsedGB = (usedBytes / (1024 ** 3)).toFixed(1);
    const diskFreeGB = (availableBytes / (1024 ** 3)).toFixed(1);
    const diskUsedPercent = totalBytes > 0 ? ((usedBytes / totalBytes) * 100).toFixed(1) : '0.0';
    const diskFreePercent = totalBytes > 0 ? ((availableBytes / totalBytes) * 100).toFixed(1) : '0.0';

    return {
        memPercent,
        memUsedMB,
        memTotalMB,
        cpuPercent: cpu.currentLoad.toFixed(1),
        diskTotalGB,
        diskUsedGB,
        diskFreeGB,
        diskUsedPercent,
        diskFreePercent,
        uptimeHours: (time.uptime / 3600).toFixed(1),
        pgStatus,
        rxSec: net.rxSec,
        txSec: net.txSec,
        rxRateStr: net.rxRateStr,
        txRateStr: net.txRateStr,
        rxTotalStr: net.rxTotalStr,
        txTotalStr: net.txTotalStr
    };
}

module.exports = { getSystemStats };
