const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const DOCKER_CACHE_TTL_MS = 10000;
const DOCKER_CMD_TIMEOUT_MS = 2500;
const GIT_CMD_TIMEOUT_MS = 1000;

let cachedContainers = null;
let lastDockerCheck = 0;

function emptyDockerResult(status = 'unavailable', error = '') {
    return { status, error, items: [] };
}

/**
 * Maps Docker CLI failures into structured status codes for the dashboard UI.
 */
function classifyDockerError(err) {
    const raw = `${err?.stderr || ''} ${err?.message || ''}`.trim();
    const lower = raw.toLowerCase();

    if (err?.code === 'ENOENT' || lower.includes('not found') || lower.includes('not recognized')) {
        return emptyDockerResult('not_installed');
    }
    if (lower.includes('permission denied') || err?.code === 'EACCES') {
        return emptyDockerResult('permission_denied', 'Permission denied accessing /var/run/docker.sock');
    }
    if (
        lower.includes('cannot connect to the docker daemon') ||
        lower.includes('is the docker daemon running') ||
        lower.includes('error during connect') ||
        lower.includes('docker_engine')
    ) {
        return emptyDockerResult('inactive', 'Docker daemon is not running');
    }

    const firstLine = raw.split(/\r?\n/)[0] || 'Unable to query Docker';
    return emptyDockerResult('error', firstLine.slice(0, 180));
}

function normalizeDockerTimestamp(ts) {
    if (!ts || typeof ts !== 'string') return '';
    if (ts.startsWith('0001-01-01')) return '';
    return ts;
}

function extractCommitFromTag(imageRef) {
    if (!imageRef || typeof imageRef !== 'string') return '';
    const withoutDigest = imageRef.split('@')[0];
    const lastSlash = withoutDigest.lastIndexOf('/');
    const tail = lastSlash >= 0 ? withoutDigest.slice(lastSlash + 1) : withoutDigest;
    const colonIdx = tail.indexOf(':');
    if (colonIdx === -1) return '';

    const tag = tail.slice(colonIdx + 1).trim();
    const shaMatch = tag.match(/^(?:sha[-_]|git[-_])?([0-9a-f]{7,40})$/i);
    return shaMatch ? shaMatch[1] : '';
}

function parseBranchFromRefDecorations(decorations) {
    if (!decorations || typeof decorations !== 'string') return '';
    const headMatch = decorations.match(/HEAD\s*->\s*([^,]+)/);
    if (headMatch) return headMatch[1].trim();
    const first = decorations.split(',')[0].trim();
    return first.replace(/^origin\//, '');
}

async function readComposeGitCommit(workingDir, gitCache) {
    if (!workingDir || typeof workingDir !== 'string') return null;
    if (gitCache.has(workingDir)) return gitCache.get(workingDir);

    let result = null;
    try {
        if (fs.existsSync(workingDir)) {
            const { stdout } = await execFileAsync(
                'git',
                ['-C', workingDir, 'log', '-1', '--format=%H%n%h%n%s%n%D'],
                { timeout: GIT_CMD_TIMEOUT_MS, encoding: 'utf8' }
            );
            const lines = stdout.trim().split(/\r?\n/);
            if (lines[0]) {
                result = {
                    commitFull: lines[0].trim(),
                    commit: (lines[1] || lines[0].slice(0, 7)).trim(),
                    commitMessage: (lines[2] || '').trim(),
                    commitBranch: parseBranchFromRefDecorations(lines[3] || '')
                };
            }
        }
    } catch {
        result = null;
    }

    gitCache.set(workingDir, result);
    return result;
}

/**
 * Resolves commit metadata prioritizing OCI/CI image labels, then commit-like
 * image tags, then local Docker Compose working_dir git history.
 */
async function resolveCommitMetadata(labels, imageName, gitCache) {
    const commitFull = (
        labels['org.opencontainers.image.revision'] ||
        labels['org.label-schema.vcs-ref'] ||
        labels['com.git.commit'] ||
        labels['git.commit'] ||
        labels['vcs-ref'] ||
        ''
    ).trim();

    const labelMessage = (
        labels['com.git.commit_message'] ||
        labels['git.commit.message'] ||
        labels['org.opencontainers.image.description'] ||
        ''
    ).trim();

    const labelBranch = (
        labels['org.opencontainers.image.ref.name'] ||
        labels['com.git.branch'] ||
        labels['git.branch'] ||
        ''
    ).trim();

    const repoUrl = (
        labels['org.opencontainers.image.source'] ||
        labels['org.label-schema.vcs-url'] ||
        ''
    ).trim();

    if (commitFull) {
        return {
            commit: commitFull.slice(0, 7),
            commitFull,
            commitMessage: labelMessage,
            commitBranch: labelBranch,
            commitSource: 'oci-label',
            repoUrl
        };
    }

    const tagCommit = extractCommitFromTag(imageName);
    if (tagCommit) {
        return {
            commit: tagCommit.slice(0, 7),
            commitFull: tagCommit,
            commitMessage: labelMessage,
            commitBranch: labelBranch,
            commitSource: 'image-tag',
            repoUrl
        };
    }

    const workingDir = labels['com.docker.compose.project.working_dir'];
    const gitInfo = await readComposeGitCommit(workingDir, gitCache);
    if (gitInfo) {
        return {
            commit: gitInfo.commit,
            commitFull: gitInfo.commitFull,
            commitMessage: gitInfo.commitMessage || labelMessage,
            commitBranch: gitInfo.commitBranch || labelBranch,
            commitSource: 'compose-git',
            repoUrl
        };
    }

    return {
        commit: '',
        commitFull: '',
        commitMessage: labelMessage,
        commitBranch: labelBranch,
        commitSource: 'none',
        repoUrl
    };
}

function parseDockerPsLines(stdout) {
    const map = new Map();
    if (!stdout || !stdout.trim()) return map;

    for (const line of stdout.trim().split(/\r?\n/)) {
        const [id = '', name = '', image = '', state = '', statusText = '', ports = ''] = line.split('\t');
        if (!id) continue;
        map.set(id, { id, name, image, state, statusText, ports });
    }
    return map;
}

async function formatContainerRecord(inspectRec, psRow, imageMap, gitCache) {
    const fullId = inspectRec.Id || psRow?.id || '';
    const shortId = fullId.slice(0, 12);
    const imageInspect = imageMap.get(inspectRec.Image) || null;
    const labels = {
        ...(imageInspect?.Config?.Labels || {}),
        ...(inspectRec.Config?.Labels || {})
    };

    const imageName = inspectRec.Config?.Image || psRow?.image || '';
    const healthObj = inspectRec.State?.Health || null;
    const healthLogs = Array.isArray(healthObj?.Log) ? healthObj.Log : [];
    const latestLog = healthLogs.length > 0 ? healthLogs[healthLogs.length - 1] : null;
    const healthOutput = latestLog
        ? `[Exit ${latestLog.ExitCode}] ${(latestLog.Output || '').trim().slice(0, 400)}`.trim()
        : '';

    const commitMeta = await resolveCommitMetadata(labels, imageName, gitCache);
    const rebuiltAt = normalizeDockerTimestamp(
        imageInspect?.Created ||
        labels['org.opencontainers.image.created'] ||
        inspectRec.Created
    );

    return {
        id: shortId,
        name: (inspectRec.Name || psRow?.name || shortId).replace(/^\/+/, ''),
        image: imageName,
        state: inspectRec.State?.Status || psRow?.state || 'unknown',
        statusText: psRow?.statusText || inspectRec.State?.Status || 'unknown',
        health: healthObj?.Status || 'none',
        healthFailingStreak: Number(healthObj?.FailingStreak) || 0,
        healthLog: healthOutput,
        restartCount: Number(inspectRec.RestartCount) || 0,
        ports: psRow?.ports || '',
        createdAt: normalizeDockerTimestamp(inspectRec.Created),
        startedAt: normalizeDockerTimestamp(inspectRec.State?.StartedAt),
        rebuiltAt,
        composeProject: (labels['com.docker.compose.project'] || '').trim(),
        composeService: (labels['com.docker.compose.service'] || '').trim(),
        ...commitMeta
    };
}

/**
 * Fetches Docker container details (health, rebuild timestamp, and commit metadata)
 * with short-lived caching so idle dashboards impose zero Docker CLI overhead.
 */
async function getDockerContainers() {
    const now = Date.now();
    if (cachedContainers && (now - lastDockerCheck) < DOCKER_CACHE_TTL_MS) {
        return cachedContainers;
    }

    let psMap;
    try {
        const { stdout } = await execFileAsync(
            'docker',
            ['ps', '-a', '--no-trunc', '--format', '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}\t{{.Ports}}'],
            { timeout: DOCKER_CMD_TIMEOUT_MS, encoding: 'utf8' }
        );
        psMap = parseDockerPsLines(stdout);
    } catch (err) {
        cachedContainers = classifyDockerError(err);
        lastDockerCheck = now;
        return cachedContainers;
    }

    if (psMap.size === 0) {
        cachedContainers = emptyDockerResult('ok');
        lastDockerCheck = now;
        return cachedContainers;
    }

    try {
        const containerIds = Array.from(psMap.keys());
        const { stdout: inspectOut } = await execFileAsync(
            'docker',
            ['inspect', ...containerIds],
            { timeout: DOCKER_CMD_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' }
        );
        const inspectRecords = JSON.parse(inspectOut);

        const uniqueImageIds = Array.from(new Set(
            inspectRecords.map(r => r.Image).filter(Boolean)
        ));
        const imageMap = new Map();
        if (uniqueImageIds.length > 0) {
            try {
                const { stdout: imageOut } = await execFileAsync(
                    'docker',
                    ['image', 'inspect', ...uniqueImageIds],
                    { timeout: DOCKER_CMD_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' }
                );
                for (const img of JSON.parse(imageOut)) {
                    if (img?.Id) imageMap.set(img.Id, img);
                }
            } catch {
                // Non-fatal: continue with container-level metadata
            }
        }

        const gitCache = new Map();
        const items = await Promise.all(
            inspectRecords.map(rec => formatContainerRecord(rec, psMap.get(rec.Id), imageMap, gitCache))
        );

        // Sort running containers first, then alphabetically by name
        items.sort((a, b) => {
            const aRun = a.state === 'running' ? 0 : 1;
            const bRun = b.state === 'running' ? 0 : 1;
            if (aRun !== bRun) return aRun - bRun;
            return a.name.localeCompare(b.name);
        });

        cachedContainers = { status: 'ok', error: '', items };
        lastDockerCheck = now;
        return cachedContainers;
    } catch (err) {
        cachedContainers = classifyDockerError(err);
        lastDockerCheck = now;
        return cachedContainers;
    }
}

module.exports = {
    getDockerContainers,
    resolveCommitMetadata,
    extractCommitFromTag,
    formatContainerRecord,
    classifyDockerError,
    parseDockerPsLines
};
