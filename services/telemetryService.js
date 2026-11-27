const fs = require('fs');
const si = require('systeminformation');
const { execSync } = require('child_process');
const { getDockerContainers } = require('./dockerService');

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

async function getTopProcesses() {
    try {
        const proc = await si.processes();
        const valid = (proc.list || []).filter(p => {
            if (!p || p.pid <= 0 || p.name === 'System Idle Process') return false;
            // Exclude transient child processes spawned by this telemetry node process (Observer Effect)
            if (p.parentPid === process.pid) return false;
            // Exclude transient shell invocation commands spawned for metric sampling
            if ((p.name === 'sh' || p.name === 'bash') && p.params && (p.params.includes('ps -axo') || p.params.includes('/proc/stat') || p.params.includes('df -'))) return false;
            return true;
        });
        return {
            byCpu: [...valid].sort((a, b) => b.cpu - a.cpu).slice(0, 10).map(p => ({
                pid: p.pid,
                user: p.user || 'system',
                cpu: +(p.cpu.toFixed(1)),
                mem: +(p.mem.toFixed(1)),
                name: p.name || 'unknown'
            })),
            byMem: [...valid].sort((a, b) => b.mem - a.mem).slice(0, 10).map(p => ({
                pid: p.pid,
                user: p.user || 'system',
                cpu: +(p.cpu.toFixed(1)),
                mem: +(p.mem.toFixed(1)),
                name: p.name || 'unknown'
            }))
        };
    } catch {
        // Fast Linux ps fallback if systeminformation encounters an issue
        if (process.platform === 'linux') {
            try {
                const raw = execSync('ps -eo pid,ppid,user,%cpu,%mem,comm', { timeout: 1500, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
                const lines = raw.trim().split('\n');
                const list = [];
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].trim().split(/\s+/);
                    if (parts.length >= 6) {
                        const pid = parseInt(parts[0], 10);
                        const ppid = parseInt(parts[1], 10);
                        if (pid <= 0 || ppid === process.pid) continue;
                        list.push({
                            pid,
                            user: parts[2] || 'root',
                            cpu: parseFloat(parts[3]) || 0,
                            mem: parseFloat(parts[4]) || 0,
                            name: parts.slice(5).join(' ') || 'unknown'
                        });
                    }
                }
                return {
                    byCpu: [...list].sort((a, b) => b.cpu - a.cpu).slice(0, 10),
                    byMem: [...list].sort((a, b) => b.mem - a.mem).slice(0, 10)
                };
            } catch {
                // ignore
            }
        }
        return { byCpu: [], byMem: [] };
    }
}

let cachedDevStack = null;
let lastDevStackCheck = 0;
const DEV_STACK_CACHE_TTL_MS = 30000; // 30s cache TTL to guarantee zero CPU overhead

const DEFAULT_DEV_STACK = [
    { key: 'nginx', name: 'Nginx', type: 'Web Server', status: 'not_installed', version: '' },
    { key: 'postgresql', name: 'PostgreSQL', type: 'Database Engine', status: 'not_installed', version: '' },
    { key: 'redis', name: 'Redis', type: 'In-Memory Cache', status: 'not_installed', version: '' },
    { key: 'docker', name: 'Docker', type: 'Container Engine', status: 'not_installed', version: '' },
    { key: 'pm2', name: 'PM2', type: 'Process Manager', status: 'not_installed', version: '' },
    { key: 'fail2ban', name: 'Fail2ban', type: 'Intrusion Shield', status: 'not_installed', version: '' },
    { key: 'ufw', name: 'UFW Firewall', type: 'Host Firewall', status: 'not_installed', version: '' },
    { key: 'node', name: 'Node.js', type: 'JavaScript Runtime', status: 'not_installed', version: '' },
    { key: 'python3', name: 'Python 3', type: 'Language Runtime', status: 'not_installed', version: '' },
    { key: 'git', name: 'Git', type: 'Version Control', status: 'not_installed', version: '' }
];

async function getDevStackStatus() {
    const now = Date.now();
    if (cachedDevStack && (now - lastDevStackCheck) < DEV_STACK_CACHE_TTL_MS) {
        return cachedDevStack;
    }

    if (process.platform !== 'linux') {
        // Fallback for non-Linux / local development environment
        cachedDevStack = DEFAULT_DEV_STACK.map(item => {
            if (item.key === 'node') return { ...item, status: 'active', version: process.version.replace('v', '') };
            return { ...item };
        });
        lastDevStackCheck = now;
        return cachedDevStack;
    }

    try {
        const script = `
check_svc() {
  local key="$1" name="$2" type="$3" svc="$4" bin="$5" ver_cmd="$6"
  local status="not_installed" ver=""
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "\${svc}.service" --no-legend 2>/dev/null | grep -q "\${svc}"; then
    local act
    act=$(systemctl is-active "$svc" 2>/dev/null || echo "inactive")
    if [ "$act" = "active" ]; then status="active"; elif [ "$act" = "failed" ]; then status="failed"; else status="inactive"; fi
  elif command -v "$bin" >/dev/null 2>&1; then
    status="inactive"
  fi
  if [ "$status" != "not_installed" ] && [ -n "$ver_cmd" ]; then
    ver=$(eval "$ver_cmd" 2>/dev/null | head -n 1 | tr -d '\\r\\n"')
  fi
  printf '{"key":"%s","name":"%s","type":"%s","status":"%s","version":"%s"}' "$key" "$name" "$type" "$status" "$ver"
}

check_cli() {
  local key="$1" name="$2" type="$3" bin="$4" ver_cmd="$5"
  local status="not_installed" ver=""
  if command -v "$bin" >/dev/null 2>&1; then
    status="active"
    if [ -n "$ver_cmd" ]; then
      ver=$(eval "$ver_cmd" 2>/dev/null | head -n 1 | tr -d '\\r\\n"')
    fi
  fi
  printf '{"key":"%s","name":"%s","type":"%s","status":"%s","version":"%s"}' "$key" "$name" "$type" "$status" "$ver"
}

check_pm2() {
  local status="not_installed" ver=""
  if command -v pm2 >/dev/null 2>&1; then
    if pm2 ping 2>/dev/null | grep -q pong || pgrep -f "PM2" >/dev/null 2>&1; then
      status="active"
    else
      status="inactive"
    fi
    ver=$(pm2 -v 2>/dev/null | tail -n 1 | tr -d '\\r\\n ')
  fi
  printf '{"key":"pm2","name":"PM2","type":"Process Manager","status":"%s","version":"%s"}' "$status" "$ver"
}

check_ufw() {
  local status="not_installed" ver=""
  if command -v ufw >/dev/null 2>&1; then
    if ufw status 2>/dev/null | grep -q "Status: active"; then
      status="active"
    else
      status="inactive"
    fi
    ver=$(ufw --version 2>/dev/null | head -n 1 | awk '{print $2}' | tr -d '\\r\\n')
  fi
  printf '{"key":"ufw","name":"UFW Firewall","type":"Host Firewall","status":"%s","version":"%s"}' "$status" "$ver"
}

check_redis() {
  local status="not_installed" ver=""
  local svc="redis"
  if command -v systemctl >/dev/null 2>&1; then
    if systemctl list-unit-files redis-server.service --no-legend 2>/dev/null | grep -q redis-server; then
      svc="redis-server"
    fi
  fi
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "\${svc}.service" --no-legend 2>/dev/null | grep -q "\${svc}"; then
    local act
    act=$(systemctl is-active "$svc" 2>/dev/null || echo "inactive")
    if [ "$act" = "active" ]; then status="active"; elif [ "$act" = "failed" ]; then status="failed"; else status="inactive"; fi
  elif command -v redis-server >/dev/null 2>&1; then
    status="inactive"
  fi
  if [ "$status" != "not_installed" ]; then
    ver=$(redis-server -v 2>/dev/null | awk -F'v=' '{print $2}' | awk '{print $1}' | tr -d '\\r\\n')
  fi
  printf '{"key":"redis","name":"Redis","type":"In-Memory Cache","status":"%s","version":"%s"}' "$status" "$ver"
}

ITEMS=()
ITEMS+=("$(check_svc "nginx" "Nginx" "Web Server" "nginx" "nginx" "nginx -v 2>&1 | awk -F/ '{print \\$2}' | awk '{print \\$1}'")")
ITEMS+=("$(check_svc "postgresql" "PostgreSQL" "Database Engine" "postgresql" "psql" "psql -V 2>/dev/null | awk '{print \\$3}'")")
ITEMS+=("$(check_redis)")
ITEMS+=("$(check_svc "docker" "Docker" "Container Engine" "docker" "docker" "docker -v 2>/dev/null | awk '{print \\$3}' | tr -d ','")")
ITEMS+=("$(check_pm2)")
ITEMS+=("$(check_svc "fail2ban" "Fail2ban" "Intrusion Shield" "fail2ban" "fail2ban-client" "fail2ban-client -v 2>/dev/null | awk '{print \\$2}'")")
ITEMS+=("$(check_ufw)")
ITEMS+=("$(check_cli "node" "Node.js" "JavaScript Runtime" "node" "node -v 2>/dev/null | tr -d v")")
ITEMS+=("$(check_cli "python3" "Python 3" "Language Runtime" "python3" "python3 --version 2>/dev/null | awk '{print \\$2}'")")
ITEMS+=("$(check_cli "git" "Git" "Version Control" "git" "git --version 2>/dev/null | awk '{print \\$3}'")")

FIRST=1
printf '['
for item in "\${ITEMS[@]}"; do
  if [ $FIRST -eq 1 ]; then FIRST=0; else printf ','; fi
  printf '%s' "$item"
done
printf ']'
`;
        const out = execSync(script, { shell: '/bin/bash', timeout: 2500, encoding: 'utf8' }).trim();
        const parsed = JSON.parse(out);
        if (Array.isArray(parsed) && parsed.length > 0) {
            cachedDevStack = parsed;
            lastDevStackCheck = now;
            return cachedDevStack;
        }
    } catch {
        // Fallback on error
    }

    return cachedDevStack || DEFAULT_DEV_STACK;
}

async function getSystemStats() {
    const [mem, cpu, disk, net, processes, devStack, containers] = await Promise.all([
        si.mem(),
        si.currentLoad(),
        si.fsSize(),
        getNetworkMetrics(),
        getTopProcesses(),
        getDevStackStatus(),
        getDockerContainers()
    ]);
    const time = si.time();

    let pgStatus = 'Offline';
    if (process.platform === 'linux') {
        try {
            execSync('pg_isready -q', { timeout: 1000, stdio: 'ignore' });
            pgStatus = 'Online';
        } catch {
            pgStatus = 'Offline';
        }
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
        txTotalStr: net.txTotalStr,
        processes,
        devStack,
        containers
    };
}

module.exports = { getSystemStats, getDevStackStatus };
