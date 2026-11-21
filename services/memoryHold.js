// === NATURAL MEMORY BUFFER (~420MB) ===
// Keeps server memory safely at ~25-28% to satisfy Oracle Always-Free reclamation rules (>20% threshold)
function initMemoryHold(sizeInMB = 420) {
    const bufferSize = sizeInMB * 1024 * 1024;
    const memoryHold = Buffer.alloc(bufferSize, 0xAA);

    // Touch 1 byte per 4KB page every 25 seconds so the Linux kernel keeps pages hot, active, and resident in physical RAM
    setInterval(() => {
        for (let i = 0; i < memoryHold.length; i += 4096) {
            memoryHold[i] = (memoryHold[i] + 1) % 255;
        }
    }, 25000);

    console.log(`[MemoryHold] Reserved and keeping ${sizeInMB}MB active in physical RAM for Oracle Always-Free compliance.`);
    return memoryHold;
}

module.exports = { initMemoryHold };
