const app = require('./app');
const config = require('./config');
const { initMemoryHold } = require('./services/memoryHold');

// 1. Maintain memory hold for Oracle Always-Free compliance (~420MB)
initMemoryHold(420);

// 2. Bind server internally to localhost (127.0.0.1)
app.listen(config.port, config.host, () => {
    console.log(`OCI Telemetry Hub listening internally on http://${config.host}:${config.port}`);
});
