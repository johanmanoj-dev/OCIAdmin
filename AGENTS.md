# Agent Operational Guidelines

## 1. Remote Server & SSH Policy
> [!CRITICAL]
> **Never initiate an SSH connection or execute remote commands against the VM (`130.210.115.179` or any other host) without asking for and receiving explicit permission from the user first.**
>
> All remote actions (e.g. testing, restarts, log checks, file transfers) must be presented to the user for approval prior to running.

---

## 2. Project Architecture & Stack
* **Runtime:** Node.js (Express 5)
* **Modular Structure:**
  * `config/`: Environment configuration loaded via `dotenv`.
  * `middleware/`: Session authentication (`requireAuth`) and login rate limiting (`loginLimiter`).
  * `services/`:
    * `memoryHold.js`: Memory buffer keeping VM RAM utilization safely >20% (Oracle Always-Free requirement).
    * `telemetryService.js`: System health and PostgreSQL status queries via `systeminformation` and `pg_isready`.
  * `views/`: True-black / obsidian styled UI views (`loginView.js`, `dashboardView.js`).
  * `routes/`: Mounted routers (`authRoutes.js`, `apiRoutes.js`, `dashboardRoutes.js`).
  * `app.js`: Express app setup and middleware assembly.
  * `server.js`: Server listener binding to internal `127.0.0.1:3000`.

---

## 3. Production Deployment & Hosting
* **Host:** Oracle Cloud Infrastructure (OCI) Always-Free VM
* **Domain:** `https://ociadmin.xeops.in`
* **Web Server:** Nginx reverse proxy forwarding to `http://127.0.0.1:3000` with Let's Encrypt SSL.
* **Process Manager:** PM2 process named `ociadmin`.
* **CI/CD:** Automated GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to production on every push to `main`.

---

## 4. Oracle Always-Free Compliance Rules
* Maintain active RAM consumption above the 20% idle reclamation threshold using the 420MB buffer and the periodic 4KB page-touching loop in `services/memoryHold.js`. Do not reduce the buffer size or disable the interval without explicit user direction.

---

## 5. Security & Secret Management
* Never commit `.env` or raw credentials to git.
* Keep `.env` and sensitive keys (`*.key`, `*.pem`) listed in `.gitignore`.
