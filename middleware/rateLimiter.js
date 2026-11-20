const rateLimit = require('express-rate-limit');

// Rate limiter: Max 5 failed login attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
});

module.exports = { loginLimiter };
