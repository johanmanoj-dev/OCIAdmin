const path = require('path');
const crypto = require('crypto');
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

// GET /install-agent.sh
router.get('/install-agent.sh', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '..', 'public', 'install-agent.sh'));
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
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const { admin } = config;

    // Strict input type check to prevent type-confusion or crash payloads
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.redirect('/login?err=1');
    }

    const trimmedUser = username.trim();
    const isUserMatch = trimmedUser === admin.username;

    let isPasswordMatch = false;

    if (admin.hash) {
        try {
            isPasswordMatch = await bcrypt.compare(password, admin.hash);
        } catch {
            isPasswordMatch = false;
        }
    } else if (admin.password) {
        // Timing-safe comparison if plain text fallback is used
        const bufA = Buffer.from(password);
        const bufB = Buffer.from(admin.password);
        if (bufA.length === bufB.length) {
            isPasswordMatch = crypto.timingSafeEqual(bufA, bufB);
        }
    }

    if (isUserMatch && isPasswordMatch) {
        // Regenerate session to prevent session fixation attacks
        return req.session.regenerate((err) => {
            if (err) {
                return res.redirect('/login?err=1');
            }
            req.session.authenticated = true;
            req.session.user = trimmedUser;
            req.session.save(() => {
                res.redirect('/');
            });
        });
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
