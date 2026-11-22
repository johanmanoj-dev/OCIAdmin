#!/usr/bin/env bash
# ==============================================================================
# OCI Telemetry Agent Installer
# Lightweight beacon for Linux VMs (Ubuntu, Debian, Oracle Linux, CentOS)
# ==============================================================================

set -e

# Default parameters
HUB_URL="https://ociadmin.xeops.in"
NODE_TOKEN=""
NODE_NAME="$(hostname -s 2>/dev/null || echo 'remote-vm')"
NODE_ID="node-$(cat /etc/machine-id 2>/dev/null | cut -c1-8 || hostname -s 2>/dev/null || echo 'vm')"

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)
      NODE_TOKEN="$2"
      shift 2
      ;;
    --name)
      NODE_NAME="$2"
      shift 2
      ;;
    --hub)
      HUB_URL="$2"
      shift 2
      ;;
    --id)
      NODE_ID="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$NODE_TOKEN" ]; then
  echo "Error: --token is required."
  echo "Usage: sudo bash install-agent.sh --token \"YOUR_TOKEN\" [--name \"OCI-AMD-VM\"]"
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (use sudo) to configure the systemd service."
  exit 1
fi

echo "==> Configuring OCI Telemetry Agent on $(hostname)..."
echo "    Node ID:   $NODE_ID"
echo "    Node Name: $NODE_NAME"
echo "    Hub URL:   $HUB_URL"

# Write the agent executable
AGENT_BIN="/usr/local/bin/oci-telemetry-agent"
cat << 'EOF' > "$AGENT_BIN"
#!/usr/bin/env bash
CONFIG_FILE="/etc/oci-telemetry-agent.conf"
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

REPORT_URL="${HUB_URL%/}/api/nodes/report"
IS_ACTIVE=false
SLEEP_INTERVAL=10
LAST_NET_RX=0
LAST_NET_TX=0
LAST_NET_TIME=0
DEV_STACK_TICKS=0
CACHED_DEV_STACK="[]"

probe_dev_stack() {
  local items=()

  check_svc() {
    local key="$1" name="$2" type="$3" svc="$4" bin="$5" ver_cmd="$6"
    local status="not_installed" ver=""
    if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "${svc}.service" --no-legend 2>/dev/null | grep -q "${svc}"; then
      local act
      act=$(systemctl is-active "$svc" 2>/dev/null || echo "inactive")
      if [ "$act" = "active" ]; then status="active"; elif [ "$act" = "failed" ]; then status="failed"; else status="inactive"; fi
    elif command -v "$bin" >/dev/null 2>&1; then
      status="inactive"
    fi
    if [ "$status" != "not_installed" ] && [ -n "$ver_cmd" ]; then
      ver=$(eval "$ver_cmd" 2>/dev/null | head -n 1 | tr -d '\r\n"')
    fi
    printf '{"key":"%s","name":"%s","type":"%s","status":"%s","version":"%s"}' "$key" "$name" "$type" "$status" "$ver"
  }

  check_cli() {
    local key="$1" name="$2" type="$3" bin="$4" ver_cmd="$5"
    local status="not_installed" ver=""
    if command -v "$bin" >/dev/null 2>&1; then
      status="active"
      if [ -n "$ver_cmd" ]; then
        ver=$(eval "$ver_cmd" 2>/dev/null | head -n 1 | tr -d '\r\n"')
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
      ver=$(pm2 -v 2>/dev/null | tail -n 1 | tr -d '\r\n ')
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
      ver=$(ufw --version 2>/dev/null | head -n 1 | awk '{print $2}' | tr -d '\r\n')
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
    if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "${svc}.service" --no-legend 2>/dev/null | grep -q "${svc}"; then
      local act
      act=$(systemctl is-active "$svc" 2>/dev/null || echo "inactive")
      if [ "$act" = "active" ]; then status="active"; elif [ "$act" = "failed" ]; then status="failed"; else status="inactive"; fi
    elif command -v redis-server >/dev/null 2>&1; then
      status="inactive"
    fi
    if [ "$status" != "not_installed" ]; then
      ver=$(redis-server -v 2>/dev/null | awk -F'v=' '{print $2}' | awk '{print $1}' | tr -d '\r\n')
    fi
    printf '{"key":"redis","name":"Redis","type":"In-Memory Cache","status":"%s","version":"%s"}' "$status" "$ver"
  }

  items+=("$(check_svc "nginx" "Nginx" "Web Server" "nginx" "nginx" "nginx -v 2>&1 | awk -F/ '{print \$2}' | awk '{print \$1}'")")
  items+=("$(check_svc "postgresql" "PostgreSQL" "Database Engine" "postgresql" "psql" "psql -V 2>/dev/null | awk '{print \$3}'")")
  items+=("$(check_redis)")
  items+=("$(check_svc "docker" "Docker" "Container Engine" "docker" "docker" "docker -v 2>/dev/null | awk '{print \$3}' | tr -d ','")")
  items+=("$(check_pm2)")
  items+=("$(check_svc "fail2ban" "Fail2ban" "Intrusion Shield" "fail2ban" "fail2ban-client" "fail2ban-client -v 2>/dev/null | awk '{print \$2}'")")
  items+=("$(check_ufw)")
  items+=("$(check_cli "node" "Node.js" "JavaScript Runtime" "node" "node -v 2>/dev/null | tr -d v")")
  items+=("$(check_cli "python3" "Python 3" "Language Runtime" "python3" "python3 --version 2>/dev/null | awk '{print \$2}'")")
  items+=("$(check_cli "git" "Git" "Version Control" "git" "git --version 2>/dev/null | awk '{print \$3}'")")

  local first=1
  printf '['
  for item in "${items[@]}"; do
    if [ $first -eq 1 ]; then first=0; else printf ','; fi
    printf '%s' "$item"
  done
  printf ']'
}

while true; do
  if [ "$IS_ACTIVE" = "true" ]; then
    # Active mode: collect CPU, RAM, Disk, Uptime and Network
    MEM_TOTAL_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}')
    MEM_AVAIL_KB=$(grep MemAvailable /proc/meminfo 2>/dev/null | awk '{print $2}')

    if [ -n "$MEM_TOTAL_KB" ] && [ -n "$MEM_AVAIL_KB" ] && [ "$MEM_TOTAL_KB" -gt 0 ]; then
      MEM_USED_KB=$((MEM_TOTAL_KB - MEM_AVAIL_KB))
      MEM_USED_MB=$((MEM_USED_KB / 1024))
      MEM_TOTAL_MB=$((MEM_TOTAL_KB / 1024))
      MEM_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($MEM_USED_KB / $MEM_TOTAL_KB) * 100}")
    else
      MEM_USED_MB=0
      MEM_TOTAL_MB=0
      MEM_PERCENT="0.0"
    fi

    CPU_LOAD_1M=$(awk '{print $1}' /proc/loadavg 2>/dev/null || echo "0.0")
    CORES=$(nproc 2>/dev/null || echo 1)
    CPU_PERCENT=$(awk "BEGIN { p = ($CPU_LOAD_1M / $CORES) * 100; if (p > 100) p = 100; printf \"%.1f\", p }")

    DISK_INFO=$(df -B1 / 2>/dev/null | tail -n 1)
    DISK_TOTAL_B=$(echo "$DISK_INFO" | awk '{print $2}')
    DISK_USED_B=$(echo "$DISK_INFO" | awk '{print $3}')
    DISK_FREE_B=$(echo "$DISK_INFO" | awk '{print $4}')

    if [ -n "$DISK_TOTAL_B" ] && [ "$DISK_TOTAL_B" -gt 0 ]; then
      DISK_TOTAL_GB=$(awk "BEGIN {printf \"%.1f\", $DISK_TOTAL_B / (1024^3)}")
      DISK_USED_GB=$(awk "BEGIN {printf \"%.1f\", $DISK_USED_B / (1024^3)}")
      DISK_FREE_GB=$(awk "BEGIN {printf \"%.1f\", $DISK_FREE_B / (1024^3)}")
      DISK_USED_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($DISK_USED_B / $DISK_TOTAL_B) * 100}")
      DISK_FREE_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($DISK_FREE_B / $DISK_TOTAL_B) * 100}")
    else
      DISK_TOTAL_GB="0.0"
      DISK_USED_GB="0.0"
      DISK_FREE_GB="0.0"
      DISK_USED_PERCENT="0.0"
      DISK_FREE_PERCENT="0.0"
    fi

    UPTIME_SECS=$(cut -d. -f1 /proc/uptime 2>/dev/null || echo 0)
    UPTIME_HOURS=$(awk "BEGIN {printf \"%.1f\", $UPTIME_SECS / 3600}")

    # Network Throughput (/proc/net/dev)
    CURR_NET_TIME=$(date +%s)
    NET_TOTALS=$(grep -v 'lo:' /proc/net/dev 2>/dev/null | grep ':' | awk -F: '{print $2}' | awk '{rx+=$1; tx+=$9} END {print rx+0, tx+0}')
    CURR_NET_RX=$(echo "$NET_TOTALS" | awk '{print $1}')
    CURR_NET_TX=$(echo "$NET_TOTALS" | awk '{print $2}')

    if [ "$LAST_NET_TIME" -gt 0 ] && [ "$CURR_NET_TIME" -gt "$LAST_NET_TIME" ] && [ "$CURR_NET_RX" -ge "$LAST_NET_RX" ]; then
      NET_TIME_DELTA=$((CURR_NET_TIME - LAST_NET_TIME))
      RX_SEC=$(( (CURR_NET_RX - LAST_NET_RX) / NET_TIME_DELTA ))
      TX_SEC=$(( (CURR_NET_TX - LAST_NET_TX) / NET_TIME_DELTA ))
    else
      RX_SEC=0
      TX_SEC=0
    fi
    LAST_NET_RX=$CURR_NET_RX
    LAST_NET_TX=$CURR_NET_TX
    LAST_NET_TIME=$CURR_NET_TIME

    # Top 10 heavy processes by CPU and Memory (excluding measurement subshells and probes)
    PROCS_CPU=$(ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu 2>/dev/null | awk 'NR>1 && $5 !~ /^(ps|head|awk|grep|sh|bash)$/ { if (c++ < 10) printf "%s{\"pid\":%d,\"user\":\"%s\",\"cpu\":%s,\"mem\":%s,\"name\":\"%s\"}", (c>1?",":""), $1, $2, $3, $4, $5 }')
    PROCS_MEM=$(ps -eo pid,user,%cpu,%mem,comm --sort=-%mem 2>/dev/null | awk 'NR>1 && $5 !~ /^(ps|head|awk|grep|sh|bash)$/ { if (c++ < 10) printf "%s{\"pid\":%d,\"user\":\"%s\",\"cpu\":%s,\"mem\":%s,\"name\":\"%s\"}", (c>1?",":""), $1, $2, $3, $4, $5 }')

    # Query dev stack every 10 ticks (30s) or on initial startup
    DEV_STACK_TICKS=$((DEV_STACK_TICKS + 1))
    if [ "$DEV_STACK_TICKS" -ge 10 ] || [ "$CACHED_DEV_STACK" = "[]" ]; then
      DEV_STACK_TICKS=0
      CACHED_DEV_STACK=$(probe_dev_stack 2>/dev/null || echo "[]")
    fi

    JSON_DATA=$(cat << JSON
{
  "nodeId": "$NODE_ID",
  "name": "$NODE_NAME",
  "standby": false,
  "memPercent": "$MEM_PERCENT",
  "memUsedMB": $MEM_USED_MB,
  "memTotalMB": $MEM_TOTAL_MB,
  "cpuPercent": "$CPU_PERCENT",
  "diskTotalGB": "$DISK_TOTAL_GB",
  "diskUsedGB": "$DISK_USED_GB",
  "diskFreeGB": "$DISK_FREE_GB",
  "diskUsedPercent": "$DISK_USED_PERCENT",
  "diskFreePercent": "$DISK_FREE_PERCENT",
  "uptimeHours": "$UPTIME_HOURS",
  "rxSec": $RX_SEC,
  "txSec": $TX_SEC,
  "rxTotal": $CURR_NET_RX,
  "txTotal": $CURR_NET_TX,
  "processes": {
    "byCpu": [ $PROCS_CPU ],
    "byMem": [ $PROCS_MEM ]
  },
  "devStack": $CACHED_DEV_STACK
}
JSON
)
  else
    # Standby mode: Zero metric calculations run on this machine!
    JSON_DATA="{\"nodeId\":\"$NODE_ID\",\"name\":\"$NODE_NAME\",\"standby\":true}"
  fi

  # Transmit payload and receive Hub active status
  RESPONSE=$(curl -s -m 4 -X POST "$REPORT_URL" \
    -H "Content-Type: application/json" \
    -H "x-node-token: $NODE_TOKEN" \
    -d "$JSON_DATA" 2>/dev/null || echo "{}")

  # If Hub reports active dashboard viewer, switch to active streaming (3s)
  if echo "$RESPONSE" | grep -q '"active":true'; then
    IS_ACTIVE=true
    SLEEP_INTERVAL=3
  else
    IS_ACTIVE=false
    SLEEP_INTERVAL=15
  fi

  sleep $SLEEP_INTERVAL
done
EOF

chmod +x "$AGENT_BIN"

# Write configuration file
CONF_FILE="/etc/oci-telemetry-agent.conf"
cat << EOF > "$CONF_FILE"
HUB_URL="$HUB_URL"
NODE_TOKEN="$NODE_TOKEN"
NODE_ID="$NODE_ID"
NODE_NAME="$NODE_NAME"
EOF
chmod 600 "$CONF_FILE"

# Create systemd service for persistent startup
SERVICE_FILE="/etc/systemd/system/oci-agent.service"
cat << EOF > "$SERVICE_FILE"
[Unit]
Description=OCI Telemetry Reporting Agent
After=network.target

[Service]
Type=simple
ExecStart=$AGENT_BIN
Restart=always
RestartSec=5s
StandardOutput=null
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload and restart service (cleanly restarts existing process if already running)
systemctl daemon-reload
systemctl enable oci-agent.service
systemctl restart oci-agent.service

echo ""
echo "========================================================="
echo " ✓ OCI Telemetry Agent installed and running persistently!"
echo "   Status: Active (Systemd: oci-agent.service)"
echo "   Mode:   Adaptive On-Demand (Standby 15s / Live 3s)"
echo "   View live stats on: $HUB_URL"
echo "========================================================="
