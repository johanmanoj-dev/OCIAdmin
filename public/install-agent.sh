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

while true; do
  if [ "$IS_ACTIVE" = "true" ]; then
    # Active mode: collect CPU, RAM, Disk and Uptime
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
  "uptimeHours": "$UPTIME_HOURS"
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

# Reload and start service
systemctl daemon-reload
systemctl enable --now oci-agent.service

echo ""
echo "========================================================="
echo " ✓ OCI Telemetry Agent installed and running persistently!"
echo "   Status: Active (Systemd: oci-agent.service)"
echo "   Beacon Interval: 5 seconds"
echo "   View live stats on: $HUB_URL"
echo "========================================================="
