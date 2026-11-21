const crypto = require('crypto');
require('dotenv').config();

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: '127.0.0.1', // Bind strictly to localhost for internal loopback security
    sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    nodeIngestToken: process.env.NODE_INGEST_TOKEN || '',
    admin: {
        username: process.env.ADMIN_USER || 'admin',
        password: process.env.ADMIN_PASSWORD || '',
        hash: process.env.ADMIN_HASH || ''
    }
};
