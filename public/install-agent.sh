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
CONTAINERS_TICKS=0
CACHED_CONTAINERS=""

probe_docker_containers() {
  if ! command -v docker >/dev/null 2>&1; then
    printf '{"status":"not_installed","error":"","items":[]}'
    return
  fi

  local ps_out rc
  ps_out=$(docker ps -a --no-trunc --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}\t{{.Ports}}' 2>&1)
  rc=$?

  if [ $rc -ne 0 ]; then
    local lower_err
    lower_err=$(printf '%s' "$ps_out" | tr '[:upper:]' '[:lower:]')
    if printf '%s' "$lower_err" | grep -q 'permission denied'; then
      printf '{"status":"permission_denied","error":"Permission denied accessing /var/run/docker.sock","items":[]}'
    elif printf '%s' "$lower_err" | grep -qE 'cannot connect to the docker daemon|is the docker daemon running|error during connect'; then
      printf '{"status":"inactive","error":"Docker daemon is not running","items":[]}'
    else
      local first_line
      first_line=$(printf '%s' "$ps_out" | head -n 1 | tr -d '\r\n"' | cut -c1-180)
      printf '{"status":"error","error":"%s","items":[]}' "$first_line"
    fi
    return
  fi

  if [ -z "$ps_out" ]; then
    printf '{"status":"ok","error":"","items":[]}'
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    DOCKER_PS_OUT="$ps_out" python3 - << 'PYEOF' 2>/dev/null
import json, os, re, subprocess

ps_lines = [l for l in os.environ.get("DOCKER_PS_OUT", "").splitlines() if l.strip()]
ps_map = {}
ids = []
for line in ps_lines:
    parts = line.split("\t")
    cid = parts[0] if len(parts) > 0 else ""
    if not cid:
        continue
    ids.append(cid)
    ps_map[cid] = {
        "name": parts[1] if len(parts) > 1 else "",
        "image": parts[2] if len(parts) > 2 else "",
        "state": parts[3] if len(parts) > 3 else "",
        "statusText": parts[4] if len(parts) > 4 else "",
        "ports": parts[5] if len(parts) > 5 else "",
    }

def norm_ts(ts):
    if not ts or not isinstance(ts, str) or ts.startswith("0001-01-01"):
        return ""
    return ts

def tag_commit(img_ref):
    if not img_ref:
        return ""
    no_digest = img_ref.split("@")[0]
    tail = no_digest.rsplit("/", 1)[-1]
    if ":" not in tail:
        return ""
    tag = tail.split(":", 1)[1].strip()
    m = re.match(r"^(?:sha[-_]|git[-_])?([0-9a-f]{7,40})$", tag, re.I)
    return m.group(1) if m else ""

git_cache = {}
def read_compose_git(work_dir):
    if not work_dir:
        return None
    if work_dir in git_cache:
        return git_cache[work_dir]
    res = None
    if os.path.isdir(work_dir):
        try:
            out = subprocess.check_output(
                ["git", "-C", work_dir, "log", "-1", "--format=%H%n%h%n%s%n%D"],
                stderr=subprocess.DEVNULL, timeout=1.5, text=True
            ).strip().splitlines()
            if out and out[0].strip():
                dec = out[3] if len(out) > 3 else ""
                m = re.search(r"HEAD\s*->\s*([^,]+)", dec)
                branch = m.group(1).strip() if m else (dec.split(",")[0].strip().removeprefix("origin/") if dec else "")
                res = {
                    "commitFull": out[0].strip(),
                    "commit": (out[1] if len(out) > 1 else out[0][:7]).strip(),
                    "commitMessage": (out[2] if len(out) > 2 else "").strip(),
                    "commitBranch": branch,
                }
        except Exception:
            res = None
    git_cache[work_dir] = res
    return res

try:
    insp = json.loads(subprocess.check_output(["docker", "inspect", *ids], stderr=subprocess.DEVNULL, timeout=3, text=True))
except Exception as e:
    print(json.dumps({"status": "error", "error": str(e)[:180], "items": []}))
    raise SystemExit(0)

img_ids = list({r.get("Image") for r in insp if r.get("Image")})
img_map = {}
if img_ids:
    try:
        imgs = json.loads(subprocess.check_output(["docker", "image", "inspect", *img_ids], stderr=subprocess.DEVNULL, timeout=3, text=True))
        for im in imgs:
            if im.get("Id"):
                img_map[im["Id"]] = im
    except Exception:
        pass

items = []
for rec in insp:
    full_id = rec.get("Id", "")
    ps_row = ps_map.get(full_id, {})
    im = img_map.get(rec.get("Image", ""), {})
    labels = {}
    labels.update((im.get("Config") or {}).get("Labels") or {})
    labels.update((rec.get("Config") or {}).get("Labels") or {})

    image_name = (rec.get("Config") or {}).get("Image") or ps_row.get("image") or ""
    state_obj = rec.get("State") or {}
    health_obj = state_obj.get("Health") or {}
    h_logs = health_obj.get("Log") or []
    latest_log = h_logs[-1] if h_logs else None
    h_output = ""
    if latest_log:
        out_txt = (latest_log.get("Output") or "").strip()[:400]
        h_output = f"[Exit {latest_log.get('ExitCode', '')}] {out_txt}".strip()

    commit_full = (
        labels.get("org.opencontainers.image.revision")
        or labels.get("org.label-schema.vcs-ref")
        or labels.get("com.git.commit")
        or labels.get("git.commit")
        or labels.get("vcs-ref")
        or ""
    ).strip()
    label_msg = (
        labels.get("com.git.commit_message")
        or labels.get("git.commit.message")
        or labels.get("org.opencontainers.image.description")
        or ""
    ).strip()
    label_branch = (
        labels.get("org.opencontainers.image.ref.name")
        or labels.get("com.git.branch")
        or labels.get("git.branch")
        or ""
    ).strip()
    repo_url = (
        labels.get("org.opencontainers.image.source")
        or labels.get("org.label-schema.vcs-url")
        or ""
    ).strip()

    if commit_full:
        commit_short, commit_src = commit_full[:7], "oci-label"
    else:
        t_commit = tag_commit(image_name)
        if t_commit:
            commit_full, commit_short, commit_src = t_commit, t_commit[:7], "image-tag"
        else:
            git_info = read_compose_git(labels.get("com.docker.compose.project.working_dir", ""))
            if git_info:
                commit_full = git_info["commitFull"]
                commit_short = git_info["commit"]
                label_msg = git_info["commitMessage"] or label_msg
                label_branch = git_info["commitBranch"] or label_branch
                commit_src = "compose-git"
            else:
                commit_full, commit_short, commit_src = "", "", "none"

    items.append({
        "id": full_id[:12],
        "name": (rec.get("Name") or ps_row.get("name") or full_id[:12]).lstrip("/"),
        "image": image_name,
        "state": state_obj.get("Status") or ps_row.get("state") or "unknown",
        "statusText": ps_row.get("statusText") or state_obj.get("Status") or "unknown",
        "health": health_obj.get("Status") or "none",
        "healthFailingStreak": int(health_obj.get("FailingStreak") or 0),
        "healthLog": h_output,
        "restartCount": int(rec.get("RestartCount") or 0),
        "ports": ps_row.get("ports") or "",
        "createdAt": norm_ts(rec.get("Created")),
        "startedAt": norm_ts(state_obj.get("StartedAt")),
        "rebuiltAt": norm_ts(im.get("Created") or labels.get("org.opencontainers.image.created") or rec.get("Created")),
        "composeProject": (labels.get("com.docker.compose.project") or "").strip(),
        "composeService": (labels.get("com.docker.compose.service") or "").strip(),
        "commit": commit_short,
        "commitFull": commit_full,
        "commitMessage": label_msg,
        "commitBranch": label_branch,
        "commitSource": commit_src,
        "repoUrl": repo_url,
    })

items.sort(key=lambda x: (0 if x["state"] == "running" else 1, x["name"]))
print(json.dumps({"status": "ok", "error": "", "items": items}, separators=(",", ":")))
PYEOF
    return
  fi

  # Fallback without python3 using Docker's native Go template JSON formatter
  local items="" first=1 cid cname cimg cstate cstatus cports row img_id rebuilt_at commit_full commit_short commit_src
  while IFS=$'\t' read -r cid cname cimg cstate cstatus cports; do
    [ -z "$cid" ] && continue
    row=$(docker inspect --format '{"id":{{json (printf "%.12s" .Id)}},"name":{{json .Name}},"image":{{json .Config.Image}},"state":{{json .State.Status}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}"none"{{end}},"healthFailingStreak":{{if .State.Health}}{{.State.Health.FailingStreak}}{{else}}0{{end}},"restartCount":{{.RestartCount}},"createdAt":{{json .Created}},"startedAt":{{json .State.StartedAt}},"commitFull":{{if .Config.Labels}}{{json (index .Config.Labels "org.opencontainers.image.revision")}}{{else}}""{{end}},"commitMessage":{{if .Config.Labels}}{{json (index .Config.Labels "com.git.commit_message")}}{{else}}""{{end}},"commitBranch":{{if .Config.Labels}}{{json (index .Config.Labels "org.opencontainers.image.ref.name")}}{{else}}""{{end}},"repoUrl":{{if .Config.Labels}}{{json (index .Config.Labels "org.opencontainers.image.source")}}{{else}}""{{end}},"composeProject":{{if .Config.Labels}}{{json (index .Config.Labels "com.docker.compose.project")}}{{else}}""{{end}},"composeService":{{if .Config.Labels}}{{json (index .Config.Labels "com.docker.compose.service")}}{{else}}""{{end}}}' "$cid" 2>/dev/null)
    [ -z "$row" ] && continue
    img_id=$(docker inspect --format '{{.Image}}' "$cid" 2>/dev/null)
    rebuilt_at=""
    if [ -n "$img_id" ]; then
      rebuilt_at=$(docker image inspect --format '{{.Created}}' "$img_id" 2>/dev/null || echo "")
    fi
    commit_full=$(docker inspect --format '{{if .Config.Labels}}{{index .Config.Labels "org.opencontainers.image.revision"}}{{end}}' "$cid" 2>/dev/null)
    commit_short=$(printf '%s' "$commit_full" | cut -c1-7)
    commit_src="none"
    [ -n "$commit_short" ] && commit_src="oci-label"
    row="${row%\}},\"statusText\":$(printf '%s' "$cstatus" | awk '{gsub(/\\/,"\\\\"); gsub(/"/,"\\\""); printf "\"%s\"", $0}'),\"ports\":$(printf '%s' "$cports" | awk '{gsub(/\\/,"\\\\"); gsub(/"/,"\\\""); printf "\"%s\"", $0}'),\"rebuiltAt\":\"$rebuilt_at\",\"healthLog\":\"\",\"commit\":\"$commit_short\",\"commitSource\":\"$commit_src\"}"
    if [ $first -eq 1 ]; then first=0; else items="${items},"; fi
    items="${items}${row}"
  done <<< "$ps_out"

  printf '{"status":"ok","error":"","items":[%s]}' "$items"
}

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

    # Query Docker containers every 4 ticks (~12s) or on initial active tick
    CONTAINERS_TICKS=$((CONTAINERS_TICKS + 1))
    if [ "$CONTAINERS_TICKS" -ge 4 ] || [ -z "$CACHED_CONTAINERS" ]; then
      CONTAINERS_TICKS=0
      CACHED_CONTAINERS=$(probe_docker_containers 2>/dev/null || echo '{"status":"error","error":"Docker probe failed","items":[]}')
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
  "devStack": $CACHED_DEV_STACK,
  "containers": $CACHED_CONTAINERS
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
