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

        /* Node Switcher Bar */
        .node-bar-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            background-color: #050505;
            border: 1px solid #1a1a1a;
            border-radius: 12px;
            padding: 8px 12px;
        }

        .node-pills-list {
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .node-pills-list::-webkit-scrollbar {
            display: none;
        }

        .node-pill {
            background-color: #0a0a0a;
            border: 1px solid #222222;
            color: #a1a1aa;
            font-size: 12px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: 999px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 150ms ease;
            white-space: nowrap;
            user-select: none;
        }

        .node-pill:hover {
            color: #ffffff;
            border-color: #3b3b3b;
            background-color: #121212;
        }

        .node-pill.active {
            background-color: #ffffff;
            color: #000000;
            border-color: #ffffff;
            font-weight: 600;
        }

        .node-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #22c55e;
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.6);
            flex-shrink: 0;
        }

        .node-status-dot.offline {
            background-color: #ef4444;
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.6);
        }

        .btn-connect-node {
            background-color: transparent;
            border: 1px dashed #333333;
            color: #a1a1aa;
            font-size: 11px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: 999px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 150ms ease;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .btn-connect-node:hover {
            color: #ffffff;
            border-color: #555555;
            background-color: #111111;
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
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 14px;
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

        /* Modal Overlay & Card */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 180ms ease;
        }

        .modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        .modal-card {
            background-color: #080808;
            border: 1px solid #1f1f1f;
            border-radius: 16px;
            width: 100%;
            max-width: 540px;
            padding: 26px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .modal-title {
            font-size: 17px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
        }

        .modal-subtitle {
            font-size: 12px;
            color: #71717a;
            margin-top: 4px;
            line-height: 1.4;
        }

        .modal-close-btn {
            background: transparent;
            border: none;
            color: #71717a;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            padding: 4px 8px;
            border-radius: 6px;
            transition: color 150ms ease;
        }

        .modal-close-btn:hover {
            color: #ffffff;
        }

        .modal-input-group {
            margin-bottom: 14px;
        }

        .modal-label {
            display: block;
            font-size: 12px;
            color: #a1a1aa;
            margin-bottom: 6px;
            font-weight: 500;
        }

        .modal-input {
            width: 100%;
            height: 38px;
            background-color: #000000;
            border: 1px solid #262626;
            border-radius: 8px;
            padding: 0 12px;
            font-size: 13px;
            color: #ffffff;
            outline: none;
            transition: border-color 150ms ease;
        }

        .modal-input:focus {
            border-color: #ffffff;
        }

        .code-box-container {
            position: relative;
            margin-top: 14px;
            margin-bottom: 16px;
        }

        .code-box {
            background-color: #000000;
            border: 1px solid #1f1f1f;
            border-radius: 8px;
            padding: 14px 16px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            color: #38bdf8;
            line-height: 1.4;
            word-break: break-all;
            user-select: all;
        }

        .btn-copy {
            width: 100%;
            height: 42px;
            background-color: #ffffff;
            color: #000000;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            transition: background-color 150ms ease;
        }

        .btn-copy:hover {
            background-color: #e5e5e5;
        }

        .modal-tip {
            font-size: 11px;
            color: #52525b;
            margin-top: 14px;
            text-align: center;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <main class="dashboard-container">
        <!-- Top Nav Bar -->
        <header class="top-bar">
            <div class="brand-cluster">
                <img class="brand-logo-small" src="/logo.png" alt="Logo" />
                <div>
                    <h1 class="brand-text-title">OCI Telemetry Console</h1>
                    <div class="brand-text-sub" id="activeNodeSub">Active Node: ARM Primary &bull; 130.210.115.179</div>
                </div>
            </div>
            <div class="header-actions">
                <span class="live-badge">
                    <span class="live-dot"></span>
                    Live 3s (On-Demand)
                </span>
                <a href="/logout" class="logout-btn">Sign Out</a>
            </div>
        </header>

        <!-- Multi-Node Switcher Bar -->
        <section class="node-bar-container">
            <div class="node-pills-list" id="nodePillsList">
                <button class="node-pill active" data-node="local" type="button">
                    <span class="node-status-dot"></span>
                    <span>ARM Primary</span>
                </button>
            </div>
            <button class="btn-connect-node" id="btnOpenConnectModal" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Connect Node</span>
            </button>
        </section>

        <!-- Memory Telemetry Panel with Real Time-Series Area Chart -->
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
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#121212" stroke-width="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#121212" stroke-width="1" />
                    <!-- Oracle 20% Threshold Line: y = 71 -->
                    <line x1="0" y1="71" x2="500" y2="71" stroke="#eab308" stroke-dasharray="3,3" stroke-width="1" stroke-opacity="0.6" />
                    <text x="8" y="67" fill="#eab308" font-size="8" font-family="-apple-system, sans-serif" font-weight="600" opacity="0.8" letter-spacing="0.04em">20% ORACLE RECLAMATION LIMIT</text>
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

        <!-- CPU Load Panel with Real Time-Series Area Chart -->
        <section class="telemetry-card">
            <div class="card-header-row">
                <div class="metric-label-group">
                    <span class="metric-title">Compute Utilization (CPU)</span>
                    <div class="metric-headline">
                        <span class="metric-big-num" id="cpuVal">--%</span>
                        <span class="metric-sub-num" id="cpuSub">Load Average</span>
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
            <!-- Database Service -->
            <section class="grid-card">
                <span class="grid-card-title" id="pgCardTitle">Database Service</span>
                <div class="grid-card-value" id="pgStatusBox">
                    <span class="status-dot" id="pgDot"></span>
                    <span id="pgVal">Checking...</span>
                </div>
                <div class="grid-card-meta">
                    <span id="pgMetaLeft">Engine: PostgreSQL 16</span>
                    <span id="pgMetaRight">Port: 5432 (Local)</span>
                </div>
            </section>

            <!-- Boot Volume Storage Card (Accurate Used vs Remaining) -->
            <section class="grid-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="grid-card-title">Boot Volume Storage</span>
                    <span id="diskUsedPercent" style="font-size: 11px; font-weight: 600; color: #a1a1aa; font-variant-numeric: tabular-nums;">--% Used</span>
                </div>
                <div class="grid-card-value" style="display: flex; align-items: baseline; justify-content: space-between;">
                    <div>
                        <strong id="diskUsedGB" style="font-size: 18px; color: #ffffff;">-- GB</strong>
                        <span style="font-size: 12px; color: #71717a;">/ <span id="diskTotalGB">-- GB</span></span>
                    </div>
                    <span id="diskFreeGB" style="font-size: 12px; color: #4ade80; font-weight: 500;">-- GB free</span>
                </div>
                <div class="progress-bar-thin">
                    <div class="progress-fill-thin" id="diskBar"></div>
                </div>
                <div class="grid-card-meta">
                    <span>Used: <strong id="diskUsedMeta" style="color: #ffffff;">-- GB</strong></span>
                    <span>Remaining: <strong id="diskFreeMeta" style="color: #4ade80;">-- GB</strong></span>
                </div>
            </section>

            <!-- Network Throughput Card -->
            <section class="grid-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="grid-card-title">Network Throughput (I/O)</span>
                    <span id="netTotalMeta" style="font-size: 11px; font-weight: 600; color: #a1a1aa; font-variant-numeric: tabular-nums;">--</span>
                </div>
                <div class="grid-card-value" style="display: flex; align-items: baseline; justify-content: space-between;">
                    <div>
                        <span style="font-size: 11px; color: #38bdf8; font-weight: 600; margin-right: 3px;">↓ RX</span>
                        <strong id="rxRateVal" style="font-size: 17px; color: #ffffff;">0 B/s</strong>
                    </div>
                    <div>
                        <span style="font-size: 11px; color: #c084fc; font-weight: 600; margin-right: 3px;">↑ TX</span>
                        <strong id="txRateVal" style="font-size: 17px; color: #ffffff;">0 B/s</strong>
                    </div>
                </div>
                <div class="progress-bar-thin">
                    <div class="progress-fill-thin" id="netBar" style="background: linear-gradient(90deg, #38bdf8, #c084fc); width: 0%;"></div>
                </div>
                <div class="grid-card-meta">
                    <span>Recv: <strong id="rxTotalMeta" style="color: #38bdf8;">--</strong></span>
                    <span>Sent: <strong id="txTotalMeta" style="color: #c084fc;">--</strong></span>
                </div>
            </section>
        </div>

        <footer class="footer-note" id="footerNodeInfo">
            Internal Loopback Gateway &bull; Pinned Memory Buffer (420 MB) &bull; PM2 Managed
        </footer>
    </main>

    <!-- Connect Node Modal -->
    <div class="modal-overlay" id="connectModalOverlay" aria-hidden="true">
        <div class="modal-card" role="dialog" aria-labelledby="modalTitle">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title" id="modalTitle">Connect Remote Linux Node</h2>
                    <p class="modal-subtitle">One command configures a persistent background beacon on any stock VM.</p>
                </div>
                <button class="modal-close-btn" id="btnCloseConnectModal" type="button" aria-label="Close dialog">&times;</button>
            </div>

            <div class="modal-input-group">
                <label class="modal-label" for="nodeNameInput">Node Name / Label</label>
                <input class="modal-input" id="nodeNameInput" type="text" value="OCI-AMD-VM" placeholder="e.g. OCI-AMD-VM" />
            </div>

            <div class="modal-input-group">
                <label class="modal-label" for="nodeTokenInput">Node Ingestion Token</label>
                <input class="modal-input" id="nodeTokenInput" type="text" readonly />
            </div>

            <div class="code-box-container">
                <div class="code-box" id="installCmdBox">Loading command...</div>
            </div>

            <button class="btn-copy" id="btnCopyCommand" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span id="copyBtnText">Copy Command</span>
            </button>

            <p class="modal-tip">Paste into the terminal of your remote VM. It will automatically run persistently via systemd and report live metrics every 5 seconds.</p>
        </div>
    </div>

    <script>
        const MAX_TICKS = 20;
        let activeNodeId = 'local';
        let activeNodeToken = '';

        // In-memory histories mapped by nodeId
        const nodeHistories = {
            local: { mem: [], cpu: [] }
        };

        function renderTimeSeries(values, lineElId, areaElId, dotElId, maxScale = 100) {
            const lineEl = document.getElementById(lineElId);
            const areaEl = document.getElementById(areaElId);
            const dotEl = document.getElementById(dotElId);
            if (!lineEl || !areaEl || !values || values.length === 0) return;

            const width = 500;
            const height = 100;
            const topPad = 15;
            const bottomPad = 15;
            const plotHeight = height - topPad - bottomPad;

            const points = values.map((val, idx) => {
                const x = values.length === 1 
                    ? width 
                    : (idx / (values.length - 1)) * width;
                const normalized = Math.min(Math.max(val / maxScale, 0), 1);
                const y = (height - bottomPad) - (normalized * plotHeight);
                return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
            });

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

        async function fetchNodeList() {
            try {
                const res = await fetch('/api/nodes');
                if (res.status === 401 || res.redirected) {
                    window.location.href = '/login';
                    return;
                }
                const data = await res.json();
                activeNodeToken = data.activeToken || '';
                updateInstallCommand();

                const pillsContainer = document.getElementById('nodePillsList');
                pillsContainer.innerHTML = '';

                data.nodes.forEach(n => {
                    const btn = document.createElement('button');
                    btn.className = 'node-pill' + (n.id === activeNodeId ? ' active' : '');
                    btn.type = 'button';
                    btn.dataset.node = n.id;
                    
                    const dotClass = n.isOnline ? 'node-status-dot' : 'node-status-dot offline';
                    btn.innerHTML = '<span class="' + dotClass + '"></span><span>' + n.name + '</span>';
                    btn.addEventListener('click', () => {
                        activeNodeId = n.id;
                        document.querySelectorAll('.node-pill').forEach(p => p.classList.remove('active'));
                        btn.classList.add('active');
                        fetchActiveStats();
                    });

                    pillsContainer.appendChild(btn);
                });
            } catch (e) {
                console.error("Error fetching nodes list:", e);
            }
        }

        async function fetchActiveStats() {
            try {
                const url = activeNodeId === 'local' 
                    ? '/api/nodes/local/stats' 
                    : '/api/nodes/' + encodeURIComponent(activeNodeId) + '/stats';

                const res = await fetch(url);
                if (res.status === 401 || res.redirected) {
                    window.location.href = '/login';
                    return;
                }
                if (!res.ok) return;

                const data = await res.json();
                const nodeInfo = data.node || {};
                const stats = data.stats || {};

                // Update node title bar
                document.getElementById('activeNodeSub').innerText = 'Active Node: ' + (nodeInfo.name || activeNodeId) + (nodeInfo.ip ? ' • ' + nodeInfo.ip : '');

                const memNum = parseFloat(stats.memPercent) || 0;
                const cpuNum = parseFloat(stats.cpuPercent) || 0;

                // Manage history
                if (!nodeHistories[activeNodeId]) {
                    nodeHistories[activeNodeId] = { mem: [], cpu: [] };
                }

                // If remote node sent history from backend, use it
                if (data.history && data.history.mem && data.history.mem.length > 0) {
                    nodeHistories[activeNodeId].mem = data.history.mem;
                    nodeHistories[activeNodeId].cpu = data.history.cpu;
                } else {
                    nodeHistories[activeNodeId].mem.push(memNum);
                    if (nodeHistories[activeNodeId].mem.length > MAX_TICKS) nodeHistories[activeNodeId].mem.shift();

                    nodeHistories[activeNodeId].cpu.push(cpuNum);
                    if (nodeHistories[activeNodeId].cpu.length > MAX_TICKS) nodeHistories[activeNodeId].cpu.shift();
                }

                // 1. Memory Panel
                document.getElementById('memPercent').innerText = memNum.toFixed(1) + '%';
                document.getElementById('memDetail').innerText = (stats.memUsedMB || 0) + ' MB / ' + (stats.memTotalMB || 0) + ' MB';
                renderTimeSeries(nodeHistories[activeNodeId].mem, 'memLine', 'memArea', 'memDot', 100);

                const safeEl = document.getElementById('safeBadge');
                if (memNum >= 20.0) {
                    safeEl.className = 'badge-status badge-safe';
                    safeEl.innerText = "✓ Compliant (>20%)";
                } else {
                    safeEl.className = 'badge-status badge-warn';
                    safeEl.innerText = "⚠ Below 20% Limit";
                }

                // 2. CPU Panel
                document.getElementById('cpuVal').innerText = cpuNum.toFixed(1) + '%';
                document.getElementById('uptimeVal').innerText = stats.uptimeHours || '--';
                const cpuMax = Math.max(10, Math.ceil(Math.max(...(nodeHistories[activeNodeId].cpu || [5]), 5) / 10) * 10);
                renderTimeSeries(nodeHistories[activeNodeId].cpu, 'cpuLine', 'cpuArea', 'cpuDot', cpuMax);

                // 3. PostgreSQL / Services
                const pgDot = document.getElementById('pgDot');
                const pgVal = document.getElementById('pgVal');
                const pgTitle = document.getElementById('pgCardTitle');
                const pgMetaLeft = document.getElementById('pgMetaLeft');
                const pgMetaRight = document.getElementById('pgMetaRight');

                if (nodeInfo.isLocal) {
                    pgTitle.innerText = "Database Service";
                    pgMetaLeft.innerText = "Engine: PostgreSQL 16";
                    pgMetaRight.innerText = "Port: 5432 (Local)";
                    if (stats.pgStatus === "Online") {
                        pgDot.style.backgroundColor = '#22c55e';
                        pgDot.style.boxShadow = '0 0 6px #22c55e';
                        pgVal.innerText = 'Online & Accepting Queries';
                    } else {
                        pgDot.style.backgroundColor = '#ef4444';
                        pgDot.style.boxShadow = '0 0 6px #ef4444';
                        pgVal.innerText = 'Offline';
                    }
                } else {
                    pgTitle.innerText = "Node Gateway";
                    pgMetaLeft.innerText = "Agent: systemd beacon";
                    pgMetaRight.innerText = "State: " + (nodeInfo.isOnline ? "Connected" : "Disconnected");
                    pgDot.style.backgroundColor = nodeInfo.isOnline ? '#22c55e' : '#ef4444';
                    pgDot.style.boxShadow = '0 0 6px ' + (nodeInfo.isOnline ? '#22c55e' : '#ef4444');
                    pgVal.innerText = nodeInfo.isOnline ? 'Online & Reporting' : 'Beacon Stalled';
                }

                // 4. Storage Card
                const totalGB = parseFloat(stats.diskTotalGB) || 0;
                const usedGB = parseFloat(stats.diskUsedGB) || 0;
                const freeGB = parseFloat(stats.diskFreeGB) || 0;
                const usedPercent = parseFloat(stats.diskUsedPercent) || (totalGB > 0 ? ((usedGB / totalGB) * 100) : 0);
                const freePercent = parseFloat(stats.diskFreePercent) || (totalGB > 0 ? ((freeGB / totalGB) * 100) : 0);

                document.getElementById('diskUsedPercent').innerText = usedPercent.toFixed(1) + '% Used';
                document.getElementById('diskUsedGB').innerText = usedGB.toFixed(1) + ' GB';
                document.getElementById('diskTotalGB').innerText = totalGB.toFixed(1) + ' GB';
                document.getElementById('diskFreeGB').innerText = freeGB.toFixed(1) + ' GB free';
                document.getElementById('diskBar').style.width = Math.min(100, Math.max(0, usedPercent)).toFixed(1) + '%';
                document.getElementById('diskUsedMeta').innerText = usedGB.toFixed(1) + ' GB';
                document.getElementById('diskFreeMeta').innerText = freeGB.toFixed(1) + ' GB (' + freePercent.toFixed(1) + '%)';

                // 5. Network Throughput Card
                const rxRate = stats.rxRateStr || '0 B/s';
                const txRate = stats.txRateStr || '0 B/s';
                const rxTotal = stats.rxTotalStr || '--';
                const txTotal = stats.txTotalStr || '--';
                const rxSec = parseInt(stats.rxSec, 10) || 0;
                const txSec = parseInt(stats.txSec, 10) || 0;

                document.getElementById('rxRateVal').innerText = rxRate;
                document.getElementById('txRateVal').innerText = txRate;
                document.getElementById('rxTotalMeta').innerText = rxTotal;
                document.getElementById('txTotalMeta').innerText = txTotal;
                document.getElementById('netTotalMeta').innerText = 'In: ' + rxTotal + ' • Out: ' + txTotal;

                const totalNetSec = rxSec + txSec;
                const netPct = totalNetSec > 0 ? Math.min(100, Math.max(3, Math.round((totalNetSec / (5 * 1024 * 1024)) * 100))) : 0;
                document.getElementById('netBar').style.width = netPct + '%';

            } catch (e) {
                console.error("Telemetry fetch error:", e);
            }
        }

        // Modal Logic
        const modalOverlay = document.getElementById('connectModalOverlay');
        const btnOpenModal = document.getElementById('btnOpenConnectModal');
        const btnCloseModal = document.getElementById('btnCloseConnectModal');
        const nodeNameInput = document.getElementById('nodeNameInput');
        const nodeTokenInput = document.getElementById('nodeTokenInput');
        const installCmdBox = document.getElementById('installCmdBox');
        const btnCopyCommand = document.getElementById('btnCopyCommand');
        const copyBtnText = document.getElementById('copyBtnText');

        function updateInstallCommand() {
            const hostUrl = window.location.origin;
            const nodeName = (nodeNameInput.value || 'OCI-AMD-VM').trim();
            const token = (activeNodeToken || '').trim();
            nodeTokenInput.value = token;

            const cmd = token
                ? 'sudo bash -c "$(curl -fsSL ' + hostUrl + '/install-agent.sh)" -- --token "' + token + '" --name "' + nodeName + '"'
                : 'Error: NODE_INGEST_TOKEN is not configured on the server. Please set it in .env first.';
            installCmdBox.innerText = cmd;
        }

        btnOpenModal.addEventListener('click', () => {
            updateInstallCommand();
            modalOverlay.classList.add('open');
        });

        btnCloseModal.addEventListener('click', () => {
            modalOverlay.classList.remove('open');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove('open');
        });

        nodeNameInput.addEventListener('input', updateInstallCommand);

        btnCopyCommand.addEventListener('click', async () => {
            const cmd = installCmdBox.innerText;
            try {
                await navigator.clipboard.writeText(cmd);
                copyBtnText.innerText = '✓ Copied!';
                setTimeout(() => { copyBtnText.innerText = 'Copy Command'; }, 2000);
            } catch (err) {
                copyBtnText.innerText = 'Select text above';
            }
        });

        // Initialize & Poll
        fetchNodeList();
        fetchActiveStats();
        setInterval(() => {
            fetchNodeList();
            fetchActiveStats();
        }, 5000);
    </script>
</body>
</html>`;
}

module.exports = { renderDashboardPage };
