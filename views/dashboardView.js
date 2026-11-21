function renderDashboardPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCI Telemetry Console | Dashboard</title>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        ::selection {
            background: #ffffff;
            color: #000000;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #000000;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 32px 16px;
            caret-color: #ffffff;
            -webkit-font-smoothing: antialiased;
        }

        .dashboard-container {
            width: 100%;
            max-width: 680px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Top Nav Bar */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background-color: #050505;
            border: 1px solid #1a1a1a;
            border-radius: 14px;
        }

        .brand-cluster {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand-logo-small {
            width: 28px;
            height: 28px;
            object-fit: contain;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
        }

        .brand-text-title {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #ffffff;
        }

        .brand-text-sub {
            font-size: 11px;
            color: #71717a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .live-badge {
            font-size: 11px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 999px;
            background-color: #052e16;
            border: 1px solid #14532d;
            color: #4ade80;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .live-dot {
            width: 6px;
            height: 6px;
            background-color: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 6px #22c55e;
            animation: pulse 2s infinite ease-in-out;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }

        .logout-btn {
            color: #a1a1aa;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid #262626;
            padding: 5px 12px;
            border-radius: 6px;
            transition: all 150ms ease;
            background-color: #0a0a0a;
        }

        .logout-btn:hover {
            color: #ffffff;
            border-color: #404040;
            background-color: #171717;
        }

        /* Telemetry Cards */
        .telemetry-card {
            background-color: #050505;
            border: 1px solid #1a1a1a;
            border-radius: 14px;
            padding: 20px 22px;
            box-shadow: 0 4px 20px -8px rgba(0, 0, 0, 0.8);
        }

        .card-header-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 14px;
        }

        .metric-label-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .metric-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #71717a;
            font-weight: 600;
        }

        .metric-headline {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-top: 2px;
        }

        .metric-big-num {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: #ffffff;
            font-variant-numeric: tabular-nums;
        }

        .metric-sub-num {
            font-size: 13px;
            color: #a1a1aa;
            font-variant-numeric: tabular-nums;
        }

        .badge-status {
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .badge-safe {
            background-color: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.25);
            color: #4ade80;
        }

        .badge-warn {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #f87171;
        }

        /* SVG Graph Canvas */
        .chart-wrapper {
            position: relative;
            width: 100%;
            height: 105px;
            background-color: #020202;
            border: 1px solid #141414;
            border-radius: 8px;
            overflow: hidden;
            margin-top: 10px;
        }

        .chart-svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        .chart-footer {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #52525b;
            margin-top: 6px;
            font-family: -apple-system, sans-serif;
            font-variant-numeric: tabular-nums;
        }

        /* Grid Row for System Items */
        .system-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }

        @media (max-width: 580px) {
            .system-grid {
                grid-template-columns: 1fr;
            }
        }

        .grid-card {
            background-color: #050505;
            border: 1px solid #1a1a1a;
            border-radius: 14px;
            padding: 16px 18px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .grid-card-title {
            font-size: 11px;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }

        .grid-card-value {
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .grid-card-meta {
            font-size: 12px;
            color: #a1a1aa;
            display: flex;
            justify-content: space-between;
            font-variant-numeric: tabular-nums;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: #22c55e;
            box-shadow: 0 0 6px #22c55e;
            flex-shrink: 0;
        }

        .progress-bar-thin {
            background-color: #141414;
            height: 4px;
            border-radius: 999px;
            overflow: hidden;
            margin-top: 2px;
        }

        .progress-fill-thin {
            background-color: #ffffff;
            height: 100%;
            width: 0%;
            border-radius: 999px;
            transition: width 400ms ease;
        }

        .footer-note {
            text-align: center;
            font-size: 11px;
            color: #52525b;
            padding: 4px 0;
        }
    </style>
</head>
<body>
    <main class="dashboard-container">
        <!-- Header -->
        <header class="top-bar">
            <div class="brand-cluster">
                <img class="brand-logo-small" src="/logo.png" alt="Logo" />
                <div>
                    <h1 class="brand-text-title">OCI Telemetry Console</h1>
                    <div class="brand-text-sub">Oracle Always-Free VM &bull; 130.210.115.179</div>
                </div>
            </div>
            <div class="header-actions">
                <span class="live-badge">
                    <span class="live-dot"></span>
                    Live 5s
                </span>
                <a href="/logout" class="logout-btn">Sign Out</a>
            </div>
        </header>

        <!-- Memory Telemetry Panel with Live Time-Series Area Chart -->
        <section class="telemetry-card">
            <div class="card-header-row">
                <div class="metric-label-group">
                    <span class="metric-title">Active Memory Allocation (RAM)</span>
                    <div class="metric-headline">
                        <span class="metric-big-num" id="memPercent">--%</span>
                        <span class="metric-sub-num" id="memDetail">-- MB / -- MB</span>
                    </div>
                </div>
                <div id="safeBadgeContainer">
                    <span class="badge-status badge-safe" id="safeBadge">Monitoring...</span>
                </div>
            </div>

            <!-- SVG Real-Time Graph -->
            <div class="chart-wrapper">
                <svg id="memSvg" class="chart-svg" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#22c55e" stop-opacity="0.28" />
                            <stop offset="100%" stop-color="#22c55e" stop-opacity="0.0" />
                        </linearGradient>
                    </defs>
                    <!-- Background Grid -->
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#121212" stroke-width="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#121212" stroke-width="1" />
                    <!-- Oracle 20% Threshold Line: y = 100 - (20 * 0.7 + 15) = 71 -->
                    <line x1="0" y1="71" x2="500" y2="71" stroke="#eab308" stroke-dasharray="3,3" stroke-width="1" stroke-opacity="0.6" />
                    <text x="8" y="67" fill="#eab308" font-size="8" font-family="-apple-system, sans-serif" font-weight="600" opacity="0.8" letter-spacing="0.04em">20% ORACLE RECLAMATION LIMIT</text>
                    <!-- Area & Line Path will be drawn dynamically -->
                    <path id="memArea" fill="url(#memGrad)" d="" />
                    <path id="memLine" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="" />
                    <circle id="memDot" cx="-10" cy="-10" r="3.5" fill="#22c55e" />
                </svg>
            </div>
            <div class="chart-footer">
                <span>-95s</span>
                <span>-75s</span>
                <span>-50s</span>
                <span>-25s</span>
                <span>Now (5s ticks)</span>
            </div>
        </section>

        <!-- CPU Load Panel with Live Time-Series Area Chart -->
        <section class="telemetry-card">
            <div class="card-header-row">
                <div class="metric-label-group">
                    <span class="metric-title">Compute Utilization (CPU)</span>
                    <div class="metric-headline">
                        <span class="metric-big-num" id="cpuVal">--%</span>
                        <span class="metric-sub-num" id="cpuSub">Load Average: Active</span>
                    </div>
                </div>
                <div>
                    <span class="metric-sub-num">Uptime: <strong id="uptimeVal" style="color: #ffffff;">--</strong>h</span>
                </div>
            </div>

            <!-- SVG Real-Time Graph -->
            <div class="chart-wrapper">
                <svg id="cpuSvg" class="chart-svg" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
                            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
                        </linearGradient>
                    </defs>
                    <!-- Background Grid -->
                    <line x1="0" y1="25" x2="500" y2="25" stroke="#121212" stroke-width="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#121212" stroke-width="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#121212" stroke-width="1" />
                    <path id="cpuArea" fill="url(#cpuGrad)" d="" />
                    <path id="cpuLine" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="" />
                    <circle id="cpuDot" cx="-10" cy="-10" r="3.5" fill="#38bdf8" />
                </svg>
            </div>
            <div class="chart-footer">
                <span>-95s</span>
                <span>-75s</span>
                <span>-50s</span>
                <span>-25s</span>
                <span>Now (5s ticks)</span>
            </div>
        </section>

        <!-- System Vitals 2-Card Row -->
        <div class="system-grid">
            <!-- PostgreSQL -->
            <section class="grid-card">
                <span class="grid-card-title">Database Service</span>
                <div class="grid-card-value" id="pgStatusBox">
                    <span class="status-dot" id="pgDot"></span>
                    <span id="pgVal">Checking...</span>
                </div>
                <div class="grid-card-meta">
                    <span>Engine: PostgreSQL 16</span>
                    <span>Port: 5432 (Local)</span>
                </div>
            </section>

            <!-- Disk Storage -->
            <section class="grid-card">
                <span class="grid-card-title">NVMe Boot Volume</span>
                <div class="grid-card-value" id="diskUsageVal">
                    -- GB Free
                </div>
                <div class="progress-bar-thin">
                    <div class="progress-fill-thin" id="diskBar"></div>
                </div>
                <div class="grid-card-meta">
                    <span id="diskDetail">-- GB total</span>
                    <span id="diskPercent">--% available</span>
                </div>
            </section>
        </div>

        <footer class="footer-note">
            Internal Loopback Gateway &bull; Pinned Memory Buffer (420 MB) &bull; PM2 Managed
        </footer>
    </main>

    <script>
        // Keep in-memory rolling history of 20 ticks (100 seconds of history at 5s interval)
        const MAX_TICKS = 20;
        const memHistory = [];
        const cpuHistory = [];

        function renderTimeSeries(values, lineElId, areaElId, dotElId, maxScale = 100) {
            const lineEl = document.getElementById(lineElId);
            const areaEl = document.getElementById(areaElId);
            const dotEl = document.getElementById(dotElId);
            if (!lineEl || !areaEl || values.length === 0) return;

            const width = 500;
            const height = 100;
            const topPad = 15;
            const bottomPad = 15;
            const plotHeight = height - topPad - bottomPad;

            // Generate coordinates
            const points = values.map((val, idx) => {
                const x = values.length === 1 
                    ? width 
                    : (idx / (values.length - 1)) * width;
                const normalized = Math.min(Math.max(val / maxScale, 0), 1);
                const y = (height - bottomPad) - (normalized * plotHeight);
                return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
            });

            // Build SVG path strings
            let linePath = "M " + points[0].x + " " + points[0].y;
            for (let i = 1; i < points.length; i++) {
                linePath += " L " + points[i].x + " " + points[i].y;
            }

            const lastPoint = points[points.length - 1];
            const areaPath = linePath + 
                " L " + lastPoint.x + " " + (height - bottomPad) + 
                " L " + points[0].x + " " + (height - bottomPad) + " Z";

            lineEl.setAttribute("d", linePath);
            areaEl.setAttribute("d", areaPath);

            if (dotEl) {
                dotEl.setAttribute("cx", lastPoint.x);
                dotEl.setAttribute("cy", lastPoint.y);
            }
        }

        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
                if (res.status === 401 || res.redirected) {
                    window.location.href = '/login';
                    return;
                }
                const data = await res.json();

                const memNum = parseFloat(data.memPercent) || 0;
                const cpuNum = parseFloat(data.cpuPercent) || 0;

                // Push to rolling history arrays (zero stress on backend)
                memHistory.push(memNum);
                if (memHistory.length > MAX_TICKS) memHistory.shift();

                cpuHistory.push(cpuNum);
                if (cpuHistory.length > MAX_TICKS) cpuHistory.shift();

                // 1. Update Memory Stats & Chart
                document.getElementById('memPercent').innerText = memNum.toFixed(1) + '%';
                document.getElementById('memDetail').innerText = data.memUsedMB + ' MB / ' + data.memTotalMB + ' MB';
                renderTimeSeries(memHistory, 'memLine', 'memArea', 'memDot', 100);

                const safeEl = document.getElementById('safeBadge');
                if (memNum >= 20.0) {
                    safeEl.className = 'badge-status badge-safe';
                    safeEl.innerText = "✓ Compliant (>20%)";
                } else {
                    safeEl.className = 'badge-status badge-warn';
                    safeEl.innerText = "⚠ Below 20% Limit";
                }

                // 2. Update CPU Stats & Chart
                document.getElementById('cpuVal').innerText = cpuNum.toFixed(1) + '%';
                document.getElementById('uptimeVal').innerText = data.uptimeHours;
                renderTimeSeries(cpuHistory, 'cpuLine', 'cpuArea', 'cpuDot', Math.max(10, Math.ceil(Math.max(...cpuHistory, 5) / 10) * 10));

                // 3. Update PostgreSQL
                const pgDot = document.getElementById('pgDot');
                const pgVal = document.getElementById('pgVal');
                if (data.pgStatus === "Online") {
                    pgDot.style.backgroundColor = '#22c55e';
                    pgDot.style.boxShadow = '0 0 6px #22c55e';
                    pgVal.innerText = 'Online & Ready';
                } else {
                    pgDot.style.backgroundColor = '#ef4444';
                    pgDot.style.boxShadow = '0 0 6px #ef4444';
                    pgVal.innerText = 'Offline';
                }

                // 4. Update Disk Storage
                const freeGB = parseFloat(data.diskFreeGB) || 0;
                const totalGB = parseFloat(data.diskTotalGB) || 1;
                const usedGB = Math.max(0, totalGB - freeGB).toFixed(1);
                const usedPercent = Math.min(100, Math.round((usedGB / totalGB) * 100));

                document.getElementById('diskUsageVal').innerText = freeGB + ' GB Free';
                document.getElementById('diskBar').style.width = (100 - usedPercent) + '%';
                document.getElementById('diskDetail').innerText = totalGB + ' GB volume (' + usedGB + ' GB in use)';
                document.getElementById('diskPercent').innerText = (100 - usedPercent) + '% free';

            } catch (e) {
                console.error("Telemetry fetch error:", e);
            }
        }

        // Initial fetch then standard 5000ms polling (no extra load)
        fetchStats();
        setInterval(fetchStats, 5000);
    </script>
</body>
</html>`;
}

module.exports = { renderDashboardPage };
