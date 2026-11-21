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

    # Top 10 heavy processes by CPU and Memory
    PROCS_CPU=$(ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu 2>/dev/null | head -n 11 | awk 'NR>1 {printf "%s{\"pid\":%d,\"user\":\"%s\",\"cpu\":%s,\"mem\":%s,\"name\":\"%s\"}", (NR>2?",":""), $1, $2, $3, $4, $5}')
    PROCS_MEM=$(ps -eo pid,user,%cpu,%mem,comm --sort=-%mem 2>/dev/null | head -n 11 | awk 'NR>1 {printf "%s{\"pid\":%d,\"user\":\"%s\",\"cpu\":%s,\"mem\":%s,\"name\":\"%s\"}", (NR>2?",":""), $1, $2, $3, $4, $5}')

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
  }
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
