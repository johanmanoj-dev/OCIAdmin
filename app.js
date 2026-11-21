const path = require('path');
const express = require('express');
const session = require('express-session');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Trust Nginx reverse proxy so req.ip and req.protocol accurately reflect client IP & HTTPS
app.set('trust proxy', 1);

// Hide server identification
app.disable('x-powered-by');

// Defense-in-depth security headers (Clickjacking, MIME sniffing, Referrer protection)
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session management
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: 'auto', // Automatically uses Secure flag when request arrives over HTTPS
        httpOnly: true,  // Immune to client-side document.cookie theft
        sameSite: 'lax', // CSRF defense
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Mount routers
app.use('/', authRoutes);
app.use('/api', apiRoutes);
app.use('/', dashboardRoutes);

module.exports = app;
