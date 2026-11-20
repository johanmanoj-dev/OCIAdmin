// === NATURAL MEMORY BUFFER (~180MB) ===
// Keeps server memory safely at ~23-26% to satisfy Oracle Always-Free reclamation rules
function initMemoryHold(sizeInMB = 180) {
    const memoryHold = Buffer.alloc(sizeInMB * 1024 * 1024, 0xAA);
    console.log(`[MemoryHold] Reserved ${sizeInMB}MB memory buffer for Oracle Always-Free compliance.`);
    return memoryHold;
}

module.exports = { initMemoryHold };
