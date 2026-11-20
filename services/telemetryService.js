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

    const primaryDisk = (disk && disk.length > 0) ? disk[0] : { available: 0, size: 0 };

    return {
        memPercent,
        memUsedMB,
        memTotalMB,
        cpuPercent: cpu.currentLoad.toFixed(1),
        diskFreeGB: (primaryDisk.available / 1024 / 1024 / 1024).toFixed(1),
        diskTotalGB: (primaryDisk.size / 1024 / 1024 / 1024).toFixed(1),
        uptimeHours: (time.uptime / 3600).toFixed(1),
        pgStatus
    };
}

module.exports = { getSystemStats };
