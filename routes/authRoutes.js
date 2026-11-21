const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { loginLimiter } = require('../middleware/rateLimiter');
const { renderLoginPage } = require('../views/loginView');
const config = require('../config');

const router = express.Router();

// GET /logo.png
router.get('/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'logo.png'));
});

// GET /login
router.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }
    const hasError = Boolean(req.query.err);
    return res.send(renderLoginPage({ hasError }));
});

// POST /login
router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    const { admin } = config;

    const isUserMatch = username === admin.username;
    const isPasswordMatch = (admin.password && password === admin.password) ||
                            (admin.hash && bcrypt.compareSync(password, admin.hash));

    if (isUserMatch && isPasswordMatch) {
        req.session.authenticated = true;
        req.session.user = username;
        return res.redirect('/');
    }

    return res.redirect('/login?err=1');
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
