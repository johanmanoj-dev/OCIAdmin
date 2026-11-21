const si = require('systeminformation');
const { execSync } = require('child_process');

async function getSystemStats() {
    const mem = await si.mem();
    const cpu = await si.currentLoad();
    const disk = await si.fsSize();
    const time = si.time();

    let pgStatus = 'Offline';
    try {
        execSync('pg_isready -q');
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
        pgStatus
    };
}

module.exports = { getSystemStats };
