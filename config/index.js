require('dotenv').config();

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: '127.0.0.1', // Bind strictly to localhost for internal loopback security
    sessionSecret: process.env.SESSION_SECRET || ('buyzen-secret-key-' + Math.random()),
    nodeIngestToken: process.env.NODE_INGEST_TOKEN || 'A_iwPd5Yp4Pg-BBq-heg',
    admin: {
        username: process.env.ADMIN_USER || 'admin',
        password: process.env.ADMIN_PASSWORD,
        hash: process.env.ADMIN_HASH
    }
};
