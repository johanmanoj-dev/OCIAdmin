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
            align-items: center;
            padding: 24px 16px;
            -webkit-font-smoothing: antialiased;
        }

        .dashboard-card {
            background-color: #000000;
            border: 1px solid #1f1f1f;
            border-radius: 16px;
            padding: 28px 24px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 0 0 1px #141414, 0 24px 48px -12px rgba(0, 0, 0, 0.9);
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid #141414;
        }

        .system-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .badge {
            font-size: 11px;
            letter-spacing: 0.05em;
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

        .badge-pulse {
            width: 6px;
            height: 6px;
            background-color: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 6px #22c55e;
        }

        .logout-btn {
            color: #737373;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid #262626;
            padding: 5px 12px;
            border-radius: 6px;
            transition: all 150ms ease;
        }

        .logout-btn:hover {
            color: #ffffff;
            border-color: #404040;
            background-color: #171717;
        }

        .metric-box {
            background-color: #080808;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 14px;
            border: 1px solid #1a1a1a;
        }

        .metric-title {
            font-size: 12px;
            color: #737373;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }

        .metric-value {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.03em;
            margin: 6px 0 4px;
            color: #ffffff;
        }

        .metric-sub {
            font-size: 13px;
            color: #a3a3a3;
        }

        .progress-bar {
            background-color: #1c1c1c;
            height: 6px;
            border-radius: 999px;
            overflow: hidden;
            margin-top: 10px;
        }

        .progress-fill {
            background-color: #ffffff;
            height: 100%;
            width: 0%;
            border-radius: 999px;
            transition: width 0.5s ease;
        }

        .safe-indicator {
            font-size: 12px;
            margin-top: 8px;
            display: block;
            color: #4ade80;
        }

        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #22c55e;
            margin-right: 6px;
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
        }

        .grid-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 8px;
            font-size: 13px;
            color: #a3a3a3;
        }

        .grid-item strong {
            color: #ffffff;
        }
    </style>
</head>
<body>
    <main class="dashboard-card">
        <header class="top-bar">
            <div class="system-info">
                <span class="badge">
                    <span class="badge-pulse"></span>
                    Live Node
                </span>
            </div>
            <a href="/logout" class="logout-btn">Sign Out</a>
        </header>

        <section class="metric-box">
            <div class="metric-title">Memory Allocation (RAM)</div>
            <div class="metric-value" id="memVal">--%</div>
            <div class="metric-sub" id="memDetail">-- MB / -- MB</div>
            <div class="progress-bar">
                <div class="progress-fill" id="memBar"></div>
            </div>
            <span class="safe-indicator" id="safeBadge"></span>
        </section>

        <section class="metric-box">
            <div class="metric-title">PostgreSQL Database</div>
            <div style="font-size: 15px; font-weight: 600; margin-top: 8px; color: #ffffff;" id="pgVal">
                <span class="status-dot"></span> Checking state...
            </div>
        </section>

        <section class="metric-box">
            <div class="metric-title">Compute & Storage</div>
            <div class="grid-row">
                <div class="grid-item">CPU: <strong id="cpuVal">--%</strong></div>
                <div class="grid-item">Uptime: <strong id="uptimeVal">--</strong>h</div>
                <div class="grid-item" style="grid-column: span 2;">Disk Free: <strong id="diskVal">-- GB</strong></div>
            </div>
        </section>
    </main>

    <script>
        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
                if (res.status === 401 || res.redirected) {
                    window.location.href = '/login';
                    return;
                }
                const data = await res.json();

                document.getElementById('memVal').innerText = data.memPercent + '%';
                document.getElementById('memDetail').innerText = data.memUsedMB + ' MB / ' + data.memTotalMB + ' MB';
                document.getElementById('memBar').style.width = data.memPercent + '%';

                const safeEl = document.getElementById('safeBadge');
                if (parseFloat(data.memPercent) >= 20.0) {
                    safeEl.innerText = "✓ Compliant with Oracle Always-Free (>20%)";
                    safeEl.style.color = "#4ade80";
                } else {
                    safeEl.innerText = "⚠ Below Oracle 20% activity limit";
                    safeEl.style.color = "#f87171";
                }

                document.getElementById('pgVal').innerHTML = data.pgStatus === "Online"
                    ? '<span class="status-dot" style="background:#22c55e; box-shadow: 0 0 6px #22c55e;"></span> Online & Accepting Queries'
                    : '<span class="status-dot" style="background:#ef4444; box-shadow: 0 0 6px #ef4444;"></span> Offline';

                document.getElementById('cpuVal').innerText = data.cpuPercent + '%';
                document.getElementById('uptimeVal').innerText = data.uptimeHours;
                document.getElementById('diskVal').innerText = data.diskFreeGB + ' GB free / ' + data.diskTotalGB + ' GB';
            } catch (e) {
                console.error("Telemetry fetch error:", e);
            }
        }

        fetchStats();
        setInterval(fetchStats, 5000);
    </script>
</body>
</html>`;
}

module.exports = { renderDashboardPage };
