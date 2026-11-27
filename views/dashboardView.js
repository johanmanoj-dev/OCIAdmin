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
            flex-wrap: wrap;
            gap: 8px;
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

        /* Telemetry Master Grid (Adaptive) */
        .telemetry-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Grid Row for System Items */
        .system-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
        }

        /* Mobile Optimization: Comfortable Single-Column Layout on Handhelds */
        @media (max-width: 480px) {
            body {
                padding: 16px 12px;
            }
            .top-bar {
                padding: 12px 14px;
                flex-wrap: wrap;
                gap: 10px;
            }
            .header-actions {
                width: 100%;
                justify-content: space-between;
            }
            .telemetry-card {
                padding: 16px 16px;
            }
        }

        @media (min-width: 580px) and (max-width: 959px) {
            .system-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        /* Desktop & Wide PC Screens: Broad Spaced Admin Command Center */
        @media (min-width: 960px) {
            body {
                padding: 40px 32px;
            }

            .dashboard-container {
                max-width: 1360px;
                gap: 22px;
            }

            .top-bar {
                padding: 18px 24px;
            }

            .brand-logo-small {
                width: 32px;
                height: 32px;
            }

            .brand-text-title {
                font-size: 16px;
            }

            .brand-text-sub {
                font-size: 12px;
            }

            .node-bar-container {
                padding: 10px 16px;
            }

            /* 2x2 Command Center Grid for the 4 Telemetry Waveforms */
            .telemetry-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 22px;
            }

            /* 2-Column Wide Grid for System Vitals */
            .system-grid {
                grid-template-columns: 1fr 1fr;
                gap: 22px;
            }

            .telemetry-card {
                padding: 24px 26px;
            }

            .grid-card {
                padding: 22px 24px;
            }

            .chart-wrapper {
                height: 125px; /* Spacious, crisp waveforms on PC monitors */
            }

            .metric-big-num {
                font-size: 28px;
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

        /* Dev Stack & Service Health Grid */
        .devstack-card {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .devstack-summary-pill {
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 600;
            color: #a1a1aa;
            background: #0a0a0a;
            border: 1px solid #1f1f1f;
            padding: 4px 10px;
            border-radius: 999px;
            font-variant-numeric: tabular-nums;
        }

        .devstack-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        @media (max-width: 380px) {
            .devstack-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (min-width: 580px) and (max-width: 959px) {
            .devstack-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
        }

        @media (min-width: 960px) {
            .devstack-grid {
                grid-template-columns: repeat(5, 1fr);
                gap: 12px;
            }
        }

        .devstack-item {
            background-color: #020202;
            border: 1px solid #141414;
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 84px;
            gap: 10px;
            transition: all 180ms ease;
        }

        .devstack-item:hover {
            border-color: #262626;
            background-color: #060606;
            transform: translateY(-1px);
        }

        .devstack-item-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }

        .devstack-tool-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }

        .devstack-tool-name {
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .devstack-tool-type {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717a;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .devstack-icon-wrapper {
            width: 26px;
            height: 26px;
            border-radius: 6px;
            background-color: #090909;
            border: 1px solid #181818;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a1a1aa;
            flex-shrink: 0;
            transition: color 150ms ease, border-color 150ms ease;
        }

        .devstack-item:hover .devstack-icon-wrapper {
            color: #ffffff;
            border-color: #27272a;
        }

        .devstack-item-bottom {
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        .devstack-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .devstack-badge-active {
            background-color: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.22);
            color: #4ade80;
        }

        .devstack-badge-inactive {
            background-color: rgba(234, 179, 8, 0.08);
            border: 1px solid rgba(234, 179, 8, 0.22);
            color: #facc15;
        }

        .devstack-badge-failed {
            background-color: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.22);
            color: #f87171;
        }

        .devstack-badge-none {
            background-color: #070707;
            border: 1px solid #191919;
            color: #52525b;
        }

        .badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .dot-active {
            background-color: #22c55e;
            box-shadow: 0 0 6px #22c55e;
        }

        .dot-inactive {
            background-color: #eab308;
            box-shadow: 0 0 5px #eab308;
        }

        .dot-failed {
            background-color: #ef4444;
            box-shadow: 0 0 6px #ef4444;
        }

        .dot-none {
            border: 1.5px solid #52525b;
            background-color: transparent;
        }

        /* Docker Containers Section */
        .docker-card {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .docker-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }

        @media (min-width: 580px) and (max-width: 959px) {
            .docker-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
        }

        @media (min-width: 960px) {
            .docker-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 14px;
            }
        }

        .container-item {
            width: 100%;
            text-align: left;
            font-family: inherit;
            background-color: #020202;
            border: 1px solid #141414;
            border-radius: 10px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            transition: all 180ms ease;
        }

        .container-item:hover {
            border-color: #2e2e2e;
            background-color: #060606;
            transform: translateY(-1px);
        }

        .container-item:focus-visible {
            outline: 1px solid #ffffff;
            outline-offset: 2px;
        }

        .container-item-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
        }

        .container-title-group {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
        }

        .container-name {
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .container-image {
            font-size: 11px;
            color: #71717a;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .container-badges {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
        }

        .devstack-badge-info {
            background-color: rgba(56, 189, 248, 0.08);
            border: 1px solid rgba(56, 189, 248, 0.25);
            color: #38bdf8;
        }

        .dot-info {
            background-color: #38bdf8;
            box-shadow: 0 0 6px #38bdf8;
        }

        .container-meta-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            border-top: 1px solid #101010;
            padding-top: 8px;
            font-size: 11px;
            color: #71717a;
            font-variant-numeric: tabular-nums;
        }

        .container-rebuild-meta {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .container-commit-chip {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 5px;
            background-color: #090909;
            border: 1px solid #1e1e1e;
            color: #38bdf8;
            flex-shrink: 0;
        }

        .container-commit-chip.muted {
            color: #52525b;
        }

        .docker-empty-state {
            grid-column: 1 / -1;
            background-color: #020202;
            border: 1px solid #141414;
            border-radius: 10px;
            padding: 22px 16px;
            text-align: center;
            font-size: 12px;
            color: #71717a;
            line-height: 1.5;
        }

        .docker-empty-state.warn {
            border-color: rgba(234, 179, 8, 0.28);
            background-color: rgba(234, 179, 8, 0.04);
            color: #facc15;
        }

        .docker-empty-state code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background-color: #0a0a0a;
            border: 1px solid #262626;
            border-radius: 4px;
            padding: 1px 6px;
            color: #ffffff;
        }

        /* Container Details Popup Modal */
        .container-modal-card {
            max-width: 620px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .container-modal-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 12px;
        }

        @media (min-width: 520px) {
            .detail-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        .detail-box {
            background-color: #020202;
            border: 1px solid #161616;
            border-radius: 10px;
            padding: 12px 14px;
        }

        .detail-box-full {
            margin-bottom: 12px;
        }

        .detail-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #71717a;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .detail-value {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            word-break: break-word;
            line-height: 1.4;
        }

        .detail-sub {
            font-size: 11px;
            color: #a1a1aa;
            margin-top: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            word-break: break-word;
            line-height: 1.4;
        }

        .commit-link {
            color: #38bdf8;
            text-decoration: none;
        }

        .commit-link:hover {
            text-decoration: underline;
        }

        .health-log-box {
            background-color: #000000;
            border: 1px solid #181818;
            border-radius: 8px;
            padding: 10px 12px;
            margin-top: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            color: #d4d4d8;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 130px;
            overflow-y: auto;
            line-height: 1.45;
        }

        /* Top Heavy Processes Inspector */
        .process-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .process-card-title {
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
        }

        .process-card-sub {
            font-size: 12px;
            color: #71717a;
            margin-left: 6px;
            font-weight: 400;
        }

        .proc-sort-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sort-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717a;
            font-weight: 600;
        }

        .proc-sort-pills {
            display: inline-flex;
            background: #0a0a0a;
            border: 1px solid #1f1f1f;
            border-radius: 999px;
            padding: 2px;
        }

        .proc-sort-btn {
            background: transparent;
            border: none;
            color: #a1a1aa;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 999px;
            cursor: pointer;
            transition: all 150ms ease;
        }

        .proc-sort-btn:hover {
            color: #ffffff;
        }

        .proc-sort-btn.active {
            background: #ffffff;
            color: #000000;
        }

        .proc-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 8px;
            border: 1px solid #141414;
            background-color: #020202;
        }

        .proc-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
        }

        .proc-table th {
            padding: 10px 12px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #52525b;
            font-weight: 600;
            background-color: #050505;
            border-bottom: 1px solid #141414;
        }

        .proc-table td {
            padding: 9px 12px;
            border-bottom: 1px solid #0d0d0d;
            vertical-align: middle;
            color: #d4d4d8;
        }

        .proc-table tr:last-child td {
            border-bottom: none;
        }

        .proc-table tr:hover td {
            background-color: #090909;
        }

        .proc-pid {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            color: #71717a;
            font-size: 11px;
            font-variant-numeric: tabular-nums;
        }

        .proc-name {
            color: #ffffff;
            font-weight: 600;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .proc-user {
            color: #a1a1aa;
            font-size: 11px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .proc-metric-cell {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            font-variant-numeric: tabular-nums;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 600;
            font-size: 11px;
        }

        .proc-bar-bg {
            width: 50px;
            height: 4px;
            background: #141414;
            border-radius: 999px;
            overflow: hidden;
            flex-shrink: 0;
        }

        .proc-bar-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 300ms ease;
        }

        .proc-bar-fill.cpu-fill {
            background-color: #38bdf8;
        }

        .proc-bar-fill.mem-fill {
            background-color: #22c55e;
        }

        .proc-cpu-val {
            color: #38bdf8;
            width: 44px;
            text-align: right;
        }

        .proc-mem-val {
            color: #22c55e;
            width: 44px;
            text-align: right;
        }

        .proc-empty {
            text-align: center;
            color: #52525b;
            padding: 24px 0;
            font-size: 12px;
        }

        @media (max-width: 580px) {
            .col-user {
                display: none;
            }
            .proc-bar-bg {
                display: none;
            }
            .proc-table td, .proc-table th {
                padding: 8px 8px;
            }
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
                    <div class="brand-text-sub" id="activeNodeSub">Active Node: Xeops-BuyZen &bull; 130.210.115.179</div>
                </div>
            </div>
            <div class="header-actions">
                <a href="/logout" class="logout-btn">Sign Out</a>
            </div>
        </header>

        <!-- Multi-Node Switcher Bar -->
        <section class="node-bar-container">
            <div class="node-pills-list" id="nodePillsList">
                <button class="node-pill active" data-node="local" type="button">
                    <span class="node-status-dot"></span>
                    <span>Xeops-BuyZen</span>
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

        <!-- Real-Time Telemetry Grid (2x2 Matrix on Desktop PC, Single-Column Stack on Mobile) -->
        <div class="telemetry-grid">
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

            <!-- Download (RX) Panel -->
            <section class="telemetry-card">
                <div class="card-header-row">
                    <div class="metric-label-group">
                        <span class="metric-title" style="color: #38bdf8;">Inbound Bandwidth &bull; Download (RX)</span>
                        <div class="metric-headline">
                            <span class="metric-big-num" id="rxRateVal" style="color: #38bdf8;">0 B/s</span>
                            <span class="metric-sub-num" id="rxPeakSub">Peak: 0 B/s</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="metric-sub-num">Total Recv: <strong id="rxTotalMeta" style="color: #ffffff;">--</strong></span>
                    </div>
                </div>

                <div class="chart-wrapper">
                    <svg id="rxSvg" class="chart-svg" viewBox="0 0 500 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.30" />
                                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
                            </linearGradient>
                        </defs>
                        <line x1="0" y1="25" x2="500" y2="25" stroke="#121212" stroke-width="1" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#121212" stroke-width="1" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#121212" stroke-width="1" />
                        <path id="rxArea" fill="url(#rxGrad)" d="" />
                        <path id="rxLine" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="" />
                        <circle id="rxDot" cx="-10" cy="-10" r="3.5" fill="#38bdf8" />
                    </svg>
                </div>
                <div class="chart-footer">
                    <span>-95s</span>
                    <span id="rxScaleMeta">Auto-scaled</span>
                    <span>Now (Live RX)</span>
                </div>
            </section>

            <!-- Upload (TX) Panel -->
            <section class="telemetry-card">
                <div class="card-header-row">
                    <div class="metric-label-group">
                        <span class="metric-title" style="color: #c084fc;">Outbound Bandwidth &bull; Upload (TX)</span>
                        <div class="metric-headline">
                            <span class="metric-big-num" id="txRateVal" style="color: #c084fc;">0 B/s</span>
                            <span class="metric-sub-num" id="txPeakSub">Peak: 0 B/s</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="metric-sub-num">Total Sent: <strong id="txTotalMeta" style="color: #ffffff;">--</strong></span>
                    </div>
                </div>

                <div class="chart-wrapper">
                    <svg id="txSvg" class="chart-svg" viewBox="0 0 500 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#c084fc" stop-opacity="0.30" />
                                <stop offset="100%" stop-color="#c084fc" stop-opacity="0.0" />
                            </linearGradient>
                        </defs>
                        <line x1="0" y1="25" x2="500" y2="25" stroke="#121212" stroke-width="1" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#121212" stroke-width="1" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#121212" stroke-width="1" />
                        <path id="txArea" fill="url(#txGrad)" d="" />
                        <path id="txLine" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="" />
                        <circle id="txDot" cx="-10" cy="-10" r="3.5" fill="#c084fc" />
                    </svg>
                </div>
                <div class="chart-footer">
                    <span>-95s</span>
                    <span id="txScaleMeta">Auto-scaled</span>
                    <span>Now (Live TX)</span>
                </div>
            </section>
        </div>

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
        </div>

        <!-- Dev Stack & Service Health Grid -->
        <section class="telemetry-card devstack-card">
            <div class="card-header-row" style="margin-bottom: 4px;">
                <div class="metric-label-group">
                    <span class="metric-title" style="color: #a1a1aa;">Dev Stack &bull; Toolchain & Daemons</span>
                    <div class="metric-headline" style="align-items: center;">
                        <span class="process-card-title">Services & Runtimes</span>
                        <span class="process-card-sub" id="devStackNodeSubtitle">Node Inspector</span>
                    </div>
                </div>
                <div>
                    <span id="devStackSummaryPill" class="devstack-summary-pill">Scanning...</span>
                </div>
            </div>

            <div class="devstack-grid" id="devStackGrid">
                <!-- Dynamically populated -->
            </div>
        </section>

        <!-- Docker Containers Monitor -->
        <section class="telemetry-card docker-card">
            <div class="card-header-row" style="margin-bottom: 4px;">
                <div class="metric-label-group">
                    <span class="metric-title" style="color: #38bdf8;">Container Runtime &bull; Deployment &amp; Health</span>
                    <div class="metric-headline" style="align-items: center;">
                        <span class="process-card-title">Docker Containers</span>
                        <span class="process-card-sub" id="dockerNodeSubtitle">Node Inspector</span>
                    </div>
                </div>
                <div>
                    <span id="dockerSummaryPill" class="devstack-summary-pill">Scanning...</span>
                </div>
            </div>

            <div class="docker-grid" id="dockerGrid">
                <div class="docker-empty-state">Checking Docker containers...</div>
            </div>
        </section>

        <!-- Top 10 Heavy Processes Panel -->
        <section class="telemetry-card process-card">
            <div class="card-header-row" style="margin-bottom: 8px;">
                <div class="metric-label-group">
                    <span class="metric-title" style="color: #a1a1aa;">Resource Consumers &bull; Active Workload</span>
                    <div class="metric-headline" style="align-items: center;">
                        <span class="process-card-title">Top 10 Heavy Processes</span>
                        <span class="process-card-sub" id="procNodeSubtitle">Live System Inspector</span>
                    </div>
                </div>
                <div class="proc-sort-controls">
                    <span class="sort-label">Sort:</span>
                    <div class="proc-sort-pills">
                        <button type="button" class="proc-sort-btn active" id="btnSortCpu" data-sort="cpu">CPU %</button>
                        <button type="button" class="proc-sort-btn" id="btnSortMem" data-sort="mem">RAM %</button>
                    </div>
                </div>
            </div>

            <div class="proc-table-wrapper">
                <table class="proc-table">
                    <thead>
                        <tr>
                            <th style="width: 75px;">PID</th>
                            <th>Process</th>
                            <th class="col-user" style="width: 95px;">User</th>
                            <th style="width: 140px; text-align: right;">CPU Load</th>
                            <th style="width: 140px; text-align: right;">RAM Allocation</th>
                        </tr>
                    </thead>
                    <tbody id="processListBody">
                        <tr>
                            <td colspan="5" class="proc-empty">Sampling active processes...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

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

    <!-- Container Details Modal -->
    <div class="modal-overlay" id="containerModalOverlay" aria-hidden="true">
        <div class="modal-card container-modal-card" role="dialog" aria-labelledby="containerModalTitle">
            <div class="modal-header">
                <div style="min-width: 0; padding-right: 12px;">
                    <h2 class="modal-title" id="containerModalTitle">Container</h2>
                    <p class="modal-subtitle" id="containerModalSubtitle">--</p>
                    <div class="container-modal-badges" id="containerModalBadges"></div>
                </div>
                <button class="modal-close-btn" id="btnCloseContainerModal" type="button" aria-label="Close container details">&times;</button>
            </div>
            <div id="containerModalBody"></div>
        </div>
    </div>

    <script>
        const MAX_TICKS = 20;
        let activeNodeId = 'local';
        let activeNodeToken = '';

        // In-memory histories mapped by nodeId
        const nodeHistories = {
            local: { mem: [], cpu: [], netRx: [], netTx: [] }
        };

        function formatSpeed(bytesPerSec) {
            const n = parseFloat(bytesPerSec) || 0;
            if (n <= 0) return '0 B/s';
            if (n < 1024) return n.toFixed(0) + ' B/s';
            if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB/s';
            return (n / (1024 * 1024)).toFixed(1) + ' MB/s';
        }

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

        // Process Table State & Renderer
        let currentProcSort = 'cpu';
        let currentProcesses = { byCpu: [], byMem: [] };

        function renderProcessTable() {
            const tbody = document.getElementById('processListBody');
            if (!tbody) return;

            const list = currentProcSort === 'mem' 
                ? (currentProcesses.byMem || []) 
                : (currentProcesses.byCpu || []);

            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="proc-empty">No active process data available</td></tr>';
                return;
            }

            const rowsHtml = list.map(p => {
                const cpuNum = parseFloat(p.cpu) || 0;
                const memNum = parseFloat(p.mem) || 0;
                const cpuBar = Math.min(100, Math.max(0, cpuNum)).toFixed(1);
                const memBar = Math.min(100, Math.max(0, memNum)).toFixed(1);

                const safeName = (p.name || 'unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeUser = (p.user || 'system').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                return '<tr>' +
                    '<td class="proc-pid">#' + p.pid + '</td>' +
                    '<td class="proc-name"><strong>' + safeName + '</strong></td>' +
                    '<td class="proc-user col-user">' + safeUser + '</td>' +
                    '<td><div class="proc-metric-cell">' +
                        '<div class="proc-bar-bg"><div class="proc-bar-fill cpu-fill" style="width: ' + cpuBar + '%;"></div></div>' +
                        '<span class="proc-cpu-val">' + cpuNum.toFixed(1) + '%</span>' +
                    '</div></td>' +
                    '<td><div class="proc-metric-cell">' +
                        '<div class="proc-bar-bg"><div class="proc-bar-fill mem-fill" style="width: ' + memBar + '%;"></div></div>' +
                        '<span class="proc-mem-val">' + memNum.toFixed(1) + '%</span>' +
                    '</div></td>' +
                '</tr>';
            }).join('');

            tbody.innerHTML = rowsHtml;
        }

        const DEV_ICONS = {
            nginx: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
            postgresql: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
            redis: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
            docker: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
            pm2: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
            fail2ban: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
            ufw: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
            node: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
            python3: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
            git: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>'
        };

        function renderDevStackGrid(devStack) {
            const grid = document.getElementById('devStackGrid');
            const summaryPill = document.getElementById('devStackSummaryPill');
            if (!grid) return;

            if (!Array.isArray(devStack) || devStack.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #52525b; padding: 24px 0; font-size: 12px;">No toolchain telemetry available</div>';
                if (summaryPill) summaryPill.innerText = 'No Data';
                return;
            }

            let activeCount = 0;
            let installedCount = 0;

            const cardsHtml = devStack.map(item => {
                const icon = DEV_ICONS[item.key] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
                let badgeClass = 'devstack-badge-none';
                let dotClass = 'dot-none';
                let statusLabel = 'Not Installed';

                if (item.status === 'active') {
                    activeCount++;
                    installedCount++;
                    badgeClass = 'devstack-badge-active';
                    dotClass = 'dot-active';
                    statusLabel = item.version ? 'Active (' + (item.version.startsWith('v') ? item.version : 'v' + item.version) + ')' : 'Active';
                } else if (item.status === 'inactive') {
                    installedCount++;
                    badgeClass = 'devstack-badge-inactive';
                    dotClass = 'dot-inactive';
                    statusLabel = item.version ? 'Stopped (' + (item.version.startsWith('v') ? item.version : 'v' + item.version) + ')' : 'Stopped';
                } else if (item.status === 'failed') {
                    installedCount++;
                    badgeClass = 'devstack-badge-failed';
                    dotClass = 'dot-failed';
                    statusLabel = 'Failed';
                }

                const safeName = (item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeType = (item.type || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                return '<div class="devstack-item">' +
                    '<div class="devstack-item-top">' +
                        '<div class="devstack-tool-info">' +
                            '<span class="devstack-tool-name">' + safeName + '</span>' +
                            '<span class="devstack-tool-type">' + safeType + '</span>' +
                        '</div>' +
                        '<div class="devstack-icon-wrapper">' + icon + '</div>' +
                    '</div>' +
                    '<div class="devstack-item-bottom">' +
                        '<span class="devstack-badge ' + badgeClass + '">' +
                            '<span class="badge-dot ' + dotClass + '"></span>' +
                            '<span>' + statusLabel + '</span>' +
                        '</span>' +
                    '</div>' +
                '</div>';
            }).join('');

            grid.innerHTML = cardsHtml;
            if (summaryPill) {
                summaryPill.innerText = activeCount + ' Active • ' + (devStack.length - installedCount) + ' Not Installed';
            }
        }

        // Docker Containers State & Modal Renderer
        let currentContainers = { status: 'unavailable', error: '', items: [] };
        let currentDevStack = [];
        let activeContainerId = null;

        function escapeHtml(val) {
            return String(val == null ? '' : val)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function safeHttpUrl(url) {
            if (!url || typeof url !== 'string') return '';
            const trimmed = url.trim();
            const lower = trimmed.toLowerCase();
            return (lower.startsWith('https://') || lower.startsWith('http://')) ? trimmed : '';
        }

        function formatTimestamp(iso) {
            if (!iso) return 'Unknown';
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return String(iso);
            return d.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        function formatRelativeTime(iso) {
            if (!iso) return '';
            const ms = Date.now() - new Date(iso).getTime();
            if (Number.isNaN(ms)) return '';
            if (ms < 0) return 'just now';
            const sec = Math.floor(ms / 1000);
            if (sec < 60) return sec + 's ago';
            const min = Math.floor(sec / 60);
            if (min < 60) return min + 'm ago';
            const hr = Math.floor(min / 60);
            if (hr < 24) return hr + 'h ago';
            const days = Math.floor(hr / 24);
            return days + 'd ago';
        }

        function getStateBadgeMeta(state) {
            const s = (state || 'unknown').toLowerCase();
            if (s === 'running') return { cls: 'devstack-badge-active', dot: 'dot-active', label: 'Running' };
            if (s === 'restarting' || s === 'created' || s === 'paused') return { cls: 'devstack-badge-inactive', dot: 'dot-inactive', label: s.charAt(0).toUpperCase() + s.slice(1) };
            if (s === 'dead' || s === 'exited' || s === 'removing') return { cls: 'devstack-badge-failed', dot: 'dot-failed', label: s.charAt(0).toUpperCase() + s.slice(1) };
            return { cls: 'devstack-badge-none', dot: 'dot-none', label: s };
        }

        function getHealthBadgeMeta(health, state) {
            const h = (health || 'none').toLowerCase();
            if (h === 'healthy') return { cls: 'devstack-badge-active', dot: 'dot-active', label: 'Healthy' };
            if (h === 'unhealthy') return { cls: 'devstack-badge-failed', dot: 'dot-failed', label: 'Unhealthy' };
            if (h === 'starting') return { cls: 'devstack-badge-info', dot: 'dot-info', label: 'Health: Starting' };
            if ((state || '').toLowerCase() === 'running') return { cls: 'devstack-badge-none', dot: 'dot-none', label: 'No Healthcheck' };
            return { cls: 'devstack-badge-none', dot: 'dot-none', label: 'Health: N/A' };
        }

        function formatCommitSource(src) {
            if (src === 'oci-label') return 'OCI Image Label';
            if (src === 'image-tag') return 'Image Tag';
            if (src === 'compose-git') return 'Compose Host Git';
            return 'Not Tagged';
        }

        function buildCommitUrl(repoUrl, commitFull) {
            const safeRepo = safeHttpUrl(repoUrl);
            if (!safeRepo || !commitFull) return '';
            const cleanRepo = safeRepo.replace(/[.]git$/i, '').replace(/[/]+$/, '');
            if (cleanRepo.includes('github.com') || cleanRepo.includes('gitlab.com')) {
                return cleanRepo + '/commit/' + encodeURIComponent(commitFull);
            }
            return cleanRepo;
        }

        function renderDockerContainers(containersData, devStack) {
            const grid = document.getElementById('dockerGrid');
            const summaryPill = document.getElementById('dockerSummaryPill');
            if (!grid) return;

            const data = (containersData && typeof containersData === 'object')
                ? containersData
                : { status: 'unavailable', error: '', items: [] };
            currentContainers = data;
            currentDevStack = Array.isArray(devStack) ? devStack : [];

            const items = Array.isArray(data.items) ? data.items : [];
            const dockerTool = currentDevStack.find(d => d.key === 'docker');

            if (data.status === 'not_installed' || (!items.length && dockerTool && dockerTool.status === 'not_installed')) {
                if (summaryPill) summaryPill.innerText = 'Not Installed';
                grid.innerHTML = '<div class="docker-empty-state">Docker is not installed on this node. Once installed, containers will appear here automatically.</div>';
                refreshOpenContainerModal();
                return;
            }

            if (data.status === 'inactive' || (!items.length && dockerTool && dockerTool.status === 'inactive')) {
                if (summaryPill) summaryPill.innerText = 'Daemon Stopped';
                grid.innerHTML = '<div class="docker-empty-state">Docker is installed, but the Docker daemon is not running.</div>';
                refreshOpenContainerModal();
                return;
            }

            if (data.status === 'permission_denied') {
                if (summaryPill) summaryPill.innerText = 'Permission Denied';
                grid.innerHTML = '<div class="docker-empty-state warn">Docker is active, but the service user cannot read <code>/var/run/docker.sock</code>.<br>Run <code>sudo usermod -aG docker ubuntu</code> and restart <code>ociadmin</code> via PM2.</div>';
                refreshOpenContainerModal();
                return;
            }

            if (data.status === 'unavailable') {
                if (summaryPill) summaryPill.innerText = 'Not Reported';
                grid.innerHTML = '<div class="docker-empty-state">Container telemetry is not reported by this node yet. Re-run the latest <code>install-agent.sh</code> on remote nodes with Docker installed.</div>';
                refreshOpenContainerModal();
                return;
            }

            if (data.status === 'error') {
                if (summaryPill) summaryPill.innerText = 'Probe Error';
                grid.innerHTML = '<div class="docker-empty-state warn">' + escapeHtml(data.error || 'Unable to inspect Docker containers') + '</div>';
                refreshOpenContainerModal();
                return;
            }

            if (items.length === 0) {
                if (summaryPill) summaryPill.innerText = '0 Containers';
                grid.innerHTML = '<div class="docker-empty-state">Docker is running, and there are currently 0 containers on this node.</div>';
                refreshOpenContainerModal();
                return;
            }

            const runningCount = items.filter(c => c.state === 'running').length;
            const healthyCount = items.filter(c => c.health === 'healthy').length;
            const unhealthyCount = items.filter(c => c.health === 'unhealthy').length;

            if (summaryPill) {
                let summaryText = runningCount + ' / ' + items.length + ' Running';
                if (unhealthyCount > 0) summaryText += ' • ' + unhealthyCount + ' Unhealthy';
                else if (healthyCount > 0) summaryText += ' • ' + healthyCount + ' Healthy';
                summaryPill.innerText = summaryText;
            }

            grid.innerHTML = items.map(c => {
                const stateMeta = getStateBadgeMeta(c.state);
                const healthMeta = getHealthBadgeMeta(c.health, c.state);
                const rebuildRel = c.rebuiltAt ? formatRelativeTime(c.rebuiltAt) : '';
                const rebuildText = rebuildRel ? ('Rebuilt ' + rebuildRel) : (c.statusText || 'Unknown build time');
                const commitText = c.commit ? escapeHtml(c.commit) : 'No Commit';
                const commitCls = c.commit ? 'container-commit-chip' : 'container-commit-chip muted';

                return '<button type="button" class="container-item" data-container-id="' + escapeHtml(c.id) + '">' +
                    '<div class="container-item-top">' +
                        '<div class="container-title-group">' +
                            '<span class="container-name">' + escapeHtml(c.name) + '</span>' +
                            '<span class="container-image" title="' + escapeHtml(c.image) + '">' + escapeHtml(c.image || 'unknown image') + '</span>' +
                        '</div>' +
                        '<div class="devstack-icon-wrapper" title="Inspect container details">' +
                            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                        '</div>' +
                    '</div>' +
                    '<div class="container-badges">' +
                        '<span class="devstack-badge ' + stateMeta.cls + '"><span class="badge-dot ' + stateMeta.dot + '"></span><span>' + escapeHtml(stateMeta.label) + '</span></span>' +
                        '<span class="devstack-badge ' + healthMeta.cls + '"><span class="badge-dot ' + healthMeta.dot + '"></span><span>' + escapeHtml(healthMeta.label) + '</span></span>' +
                    '</div>' +
                    '<div class="container-meta-footer">' +
                        '<span class="container-rebuild-meta" title="' + escapeHtml(formatTimestamp(c.rebuiltAt)) + '">' + escapeHtml(rebuildText) + '</span>' +
                        '<span class="' + commitCls + '">' + commitText + '</span>' +
                    '</div>' +
                '</button>';
            }).join('');

            refreshOpenContainerModal();
        }

        function renderContainerModalContent(containerId) {
            const titleEl = document.getElementById('containerModalTitle');
            const subEl = document.getElementById('containerModalSubtitle');
            const badgesEl = document.getElementById('containerModalBadges');
            const bodyEl = document.getElementById('containerModalBody');
            if (!titleEl || !subEl || !badgesEl || !bodyEl) return;

            const items = Array.isArray(currentContainers.items) ? currentContainers.items : [];
            const c = items.find(item => item.id === containerId);
            if (!c) {
                badgesEl.innerHTML = '';
                bodyEl.innerHTML = '<div class="docker-empty-state">Container is no longer present on this node.</div>';
                return;
            }

            const stateMeta = getStateBadgeMeta(c.state);
            const healthMeta = getHealthBadgeMeta(c.health, c.state);

            titleEl.innerText = c.name;
            subEl.innerText = (c.image || 'unknown image') + ' • #' + c.id;
            badgesEl.innerHTML =
                '<span class="devstack-badge ' + stateMeta.cls + '"><span class="badge-dot ' + stateMeta.dot + '"></span><span>' + escapeHtml(stateMeta.label) + '</span></span>' +
                '<span class="devstack-badge ' + healthMeta.cls + '"><span class="badge-dot ' + healthMeta.dot + '"></span><span>' + escapeHtml(healthMeta.label) + '</span></span>' +
                (c.composeProject ? '<span class="devstack-badge devstack-badge-none">Stack: ' + escapeHtml(c.composeProject + (c.composeService ? '/' + c.composeService : '')) + '</span>' : '');

            const rebuiltRel = formatRelativeTime(c.rebuiltAt);
            const startedRel = formatRelativeTime(c.startedAt);
            const commitUrl = buildCommitUrl(c.repoUrl, c.commitFull);

            const commitValueHtml = c.commit
                ? (commitUrl
                    ? '<a class="commit-link" href="' + escapeHtml(commitUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(c.commitFull || c.commit) + '</a>'
                    : escapeHtml(c.commitFull || c.commit))
                : 'Not recorded';

            const commitMetaParts = [
                'Source: ' + formatCommitSource(c.commitSource),
                c.commitBranch ? 'Branch: ' + c.commitBranch : ''
            ].filter(Boolean);

            const healthExtra = c.healthFailingStreak > 0
                ? 'Failing streak: ' + c.healthFailingStreak + ' • Restarts: ' + (c.restartCount || 0)
                : 'Restarts: ' + (c.restartCount || 0);

            bodyEl.innerHTML =
                '<div class="detail-grid">' +
                    '<div class="detail-box">' +
                        '<div class="detail-label">Health Check</div>' +
                        '<div class="detail-value">' + escapeHtml(healthMeta.label) + '</div>' +
                        '<div class="detail-sub">' + escapeHtml(healthExtra) + '</div>' +
                    '</div>' +
                    '<div class="detail-box">' +
                        '<div class="detail-label">Runtime Status</div>' +
                        '<div class="detail-value">' + escapeHtml(c.statusText || stateMeta.label) + '</div>' +
                        '<div class="detail-sub">Started: ' + escapeHtml(c.startedAt ? (formatTimestamp(c.startedAt) + (startedRel ? ' (' + startedRel + ')' : '')) : 'Not started') + '</div>' +
                    '</div>' +
                    '<div class="detail-box">' +
                        '<div class="detail-label">Last Rebuild Time</div>' +
                        '<div class="detail-value">' + escapeHtml(c.rebuiltAt ? formatTimestamp(c.rebuiltAt) : 'Unknown') + '</div>' +
                        '<div class="detail-sub">' + escapeHtml(rebuiltRel ? ('Image built ' + rebuiltRel) : 'Image build timestamp unavailable') + '</div>' +
                    '</div>' +
                    '<div class="detail-box">' +
                        '<div class="detail-label">Exposed Ports</div>' +
                        '<div class="detail-value">' + escapeHtml(c.ports || 'None exposed') + '</div>' +
                        '<div class="detail-sub">Created: ' + escapeHtml(c.createdAt ? formatTimestamp(c.createdAt) : 'Unknown') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="detail-box detail-box-full">' +
                    '<div class="detail-label">Git Commit</div>' +
                    '<div class="detail-value" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">' + commitValueHtml + '</div>' +
                    (c.commitMessage ? '<div class="detail-sub" style="color: #e4e4e7;">' + escapeHtml(c.commitMessage) + '</div>' : '') +
                    '<div class="detail-sub">' + escapeHtml(commitMetaParts.join(' • ')) + '</div>' +
                '</div>' +
                (c.healthLog
                    ? '<div class="detail-box">' +
                        '<div class="detail-label">Latest Healthcheck Output</div>' +
                        '<div class="health-log-box">' + escapeHtml(c.healthLog) + '</div>' +
                      '</div>'
                    : '');
        }

        function openContainerModal(containerId) {
            const overlay = document.getElementById('containerModalOverlay');
            if (!overlay) return;
            activeContainerId = containerId;
            renderContainerModalContent(containerId);
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        }

        function closeContainerModal() {
            const overlay = document.getElementById('containerModalOverlay');
            if (!overlay) return;
            activeContainerId = null;
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
        }

        function refreshOpenContainerModal() {
            const overlay = document.getElementById('containerModalOverlay');
            if (activeContainerId && overlay && overlay.classList.contains('open')) {
                renderContainerModalContent(activeContainerId);
            }
        }

        const btnSortCpu = document.getElementById('btnSortCpu');
        const btnSortMem = document.getElementById('btnSortMem');
        if (btnSortCpu && btnSortMem) {
            btnSortCpu.addEventListener('click', () => {
                currentProcSort = 'cpu';
                btnSortCpu.classList.add('active');
                btnSortMem.classList.remove('active');
                renderProcessTable();
            });
            btnSortMem.addEventListener('click', () => {
                currentProcSort = 'mem';
                btnSortMem.classList.add('active');
                btnSortCpu.classList.remove('active');
                renderProcessTable();
            });
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
                        closeContainerModal();
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
                    nodeHistories[activeNodeId] = { mem: [], cpu: [], netRx: [], netTx: [] };
                }

                const rxSec = parseInt(stats.rxSec, 10) || 0;
                const txSec = parseInt(stats.txSec, 10) || 0;

                // If remote node sent history from backend, use it
                if (data.history && data.history.mem && data.history.mem.length > 0) {
                    nodeHistories[activeNodeId].mem = data.history.mem;
                    nodeHistories[activeNodeId].cpu = data.history.cpu;
                    if (data.history.netRx && data.history.netRx.length > 0) nodeHistories[activeNodeId].netRx = data.history.netRx;
                    if (data.history.netTx && data.history.netTx.length > 0) nodeHistories[activeNodeId].netTx = data.history.netTx;
                } else {
                    nodeHistories[activeNodeId].mem.push(memNum);
                    if (nodeHistories[activeNodeId].mem.length > MAX_TICKS) nodeHistories[activeNodeId].mem.shift();

                    nodeHistories[activeNodeId].cpu.push(cpuNum);
                    if (nodeHistories[activeNodeId].cpu.length > MAX_TICKS) nodeHistories[activeNodeId].cpu.shift();

                    nodeHistories[activeNodeId].netRx.push(rxSec);
                    if (nodeHistories[activeNodeId].netRx.length > MAX_TICKS) nodeHistories[activeNodeId].netRx.shift();

                    nodeHistories[activeNodeId].netTx.push(txSec);
                    if (nodeHistories[activeNodeId].netTx.length > MAX_TICKS) nodeHistories[activeNodeId].netTx.shift();
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

                // 3. Network Dual Graphs (Download RX & Upload TX)
                const rxRate = stats.rxRateStr || '0 B/s';
                const txRate = stats.txRateStr || '0 B/s';
                const rxTotal = stats.rxTotalStr || '--';
                const txTotal = stats.txTotalStr || '--';

                document.getElementById('rxRateVal').innerText = rxRate;
                document.getElementById('txRateVal').innerText = txRate;
                document.getElementById('rxTotalMeta').innerText = rxTotal;
                document.getElementById('txTotalMeta').innerText = txTotal;

                // Autoscaling and Peak calculation for RX
                const rxVals = nodeHistories[activeNodeId].netRx || [];
                const maxRxVal = Math.max(...rxVals, rxSec, 1024);
                const rxScale = Math.ceil(maxRxVal * 1.25);
                document.getElementById('rxScaleMeta').innerText = 'Scale: 0 - ' + formatSpeed(rxScale);
                document.getElementById('rxPeakSub').innerText = 'Peak: ' + formatSpeed(Math.max(...rxVals, rxSec));
                renderTimeSeries(rxVals, 'rxLine', 'rxArea', 'rxDot', rxScale);

                // Autoscaling and Peak calculation for TX
                const txVals = nodeHistories[activeNodeId].netTx || [];
                const maxTxVal = Math.max(...txVals, txSec, 1024);
                const txScale = Math.ceil(maxTxVal * 1.25);
                document.getElementById('txScaleMeta').innerText = 'Scale: 0 - ' + formatSpeed(txScale);
                document.getElementById('txPeakSub').innerText = 'Peak: ' + formatSpeed(Math.max(...txVals, txSec));
                renderTimeSeries(txVals, 'txLine', 'txArea', 'txDot', txScale);

                // 4. Database Service / Gateway
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

                // 5. Storage Card
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

                // 6. Dev Stack & Service Health Grid
                const devSub = document.getElementById('devStackNodeSubtitle');
                if (devSub) {
                    devSub.innerText = 'Node: ' + (nodeInfo.name || activeNodeId);
                }
                renderDevStackGrid(stats.devStack);

                // 7. Docker Containers Monitor
                const dockerSub = document.getElementById('dockerNodeSubtitle');
                if (dockerSub) {
                    dockerSub.innerText = 'Node: ' + (nodeInfo.name || activeNodeId);
                }
                renderDockerContainers(stats.containers, stats.devStack);

                // 8. Top 10 Heavy Processes
                const procSub = document.getElementById('procNodeSubtitle');
                if (procSub) {
                    procSub.innerText = 'Node: ' + (nodeInfo.name || activeNodeId);
                }
                if (stats.processes) {
                    currentProcesses = stats.processes;
                    renderProcessTable();
                }

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

        // Container Grid & Details Modal Events
        const dockerGridEl = document.getElementById('dockerGrid');
        const containerModalOverlay = document.getElementById('containerModalOverlay');
        const btnCloseContainerModal = document.getElementById('btnCloseContainerModal');

        if (dockerGridEl) {
            dockerGridEl.addEventListener('click', (e) => {
                const card = e.target.closest('.container-item');
                if (!card || !card.dataset.containerId) return;
                openContainerModal(card.dataset.containerId);
            });
        }

        if (btnCloseContainerModal) {
            btnCloseContainerModal.addEventListener('click', closeContainerModal);
        }

        if (containerModalOverlay) {
            containerModalOverlay.addEventListener('click', (e) => {
                if (e.target === containerModalOverlay) closeContainerModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modalOverlay.classList.remove('open');
                closeContainerModal();
            }
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
