function renderLoginPage({ hasError = false } = {}) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In | OCI Telemetry Console</title>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        ::selection {
            background: #ffffff;
            color: #000000;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #000000;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px 16px;
            caret-color: #ffffff;
            -webkit-font-smoothing: antialiased;
        }

        .bg-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(85vw, 680px);
            max-height: 75vh;
            object-fit: contain;
            pointer-events: none;
            z-index: 0;
            opacity: 0.07;
            mix-blend-mode: screen;
            user-select: none;
        }

        .login-card {
            position: relative;
            z-index: 1;
            background-color: rgba(0, 0, 0, 0.88);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid #1f1f1f;
            border-radius: 16px;
            width: 100%;
            max-width: 380px;
            padding: 36px 30px;
            box-shadow: 0 0 0 1px #141414, 0 24px 48px -12px rgba(0, 0, 0, 0.9);
        }

        .brand-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-bottom: 28px;
        }

        .brand-logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
        }

        .brand-logo {
            width: 78px;
            height: auto;
            max-height: 52px;
            object-fit: contain;
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.15));
            transition: transform 200ms ease;
        }

        .brand-logo:hover {
            transform: scale(1.04);
        }

        .brand-title {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.025em;
            color: #ffffff;
            margin-bottom: 6px;
        }

        .brand-subtitle {
            font-size: 13px;
            color: #737373;
            line-height: 1.4;
        }

        .alert-error {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background-color: #0f0505;
            border: 1px solid #3b1212;
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 22px;
            color: #f87171;
            font-size: 13px;
            line-height: 1.4;
        }

        .alert-icon {
            flex-shrink: 0;
            margin-top: 1px;
            color: #ef4444;
        }

        .form-group {
            margin-bottom: 18px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #a3a3a3;
            margin-bottom: 8px;
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .field-icon {
            position: absolute;
            left: 12px;
            color: #525252;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .form-input {
            width: 100%;
            height: 42px;
            background-color: #000000;
            border: 1px solid #262626;
            border-radius: 8px;
            padding: 0 12px 0 38px;
            font-size: 14px;
            color: #ffffff;
            outline: none;
            transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .form-input.has-toggle {
            padding-right: 40px;
        }

        .form-input::placeholder {
            color: #404040;
        }

        .form-input:hover {
            border-color: #404040;
        }

        .form-input:focus-visible {
            border-color: #ffffff;
            box-shadow: 0 0 0 1px #ffffff;
        }

        .toggle-btn {
            position: absolute;
            right: 8px;
            background: transparent;
            border: none;
            color: #525252;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 150ms ease, background-color 150ms ease;
        }

        .toggle-btn:hover {
            color: #ffffff;
            background-color: #171717;
        }

        .toggle-btn:focus-visible {
            outline: 2px solid #ffffff;
            outline-offset: 1px;
        }

        .btn-submit {
            width: 100%;
            height: 44px;
            background-color: #ffffff;
            color: #000000;
            border: 1px solid #ffffff;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            margin-top: 24px;
            transition: background-color 150ms ease, border-color 150ms ease, transform 100ms ease;
        }

        .btn-submit:hover {
            background-color: #e5e5e5;
            border-color: #e5e5e5;
        }

        .btn-submit:active {
            background-color: #d4d4d4;
            transform: scale(0.99);
        }

        .btn-submit:focus-visible {
            outline: 2px solid #ffffff;
            outline-offset: 2px;
        }

        .login-footer {
            margin-top: 26px;
            padding-top: 18px;
            border-top: 1px solid #141414;
            text-align: center;
        }

        .security-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #525252;
            letter-spacing: 0.01em;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            background-color: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
        }
    </style>
</head>
<body>
    <img class="bg-watermark" src="/logo.png" alt="" aria-hidden="true" />
    <main class="login-card">
        <header class="brand-header">
            <div class="brand-logo-container">
                <img class="brand-logo" src="/logo.png" alt="Logo" />
            </div>
            <h1 class="brand-title">OCI Telemetry Console</h1>
            <p class="brand-subtitle">Sign in to monitor instance health and metrics</p>
        </header>

        ${hasError ? `
        <div class="alert-error" role="alert">
            <svg class="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>Invalid credentials. Please verify your username and password.</div>
        </div>
        ` : ''}

        <form method="POST" action="/login">
            <div class="form-group">
                <label class="form-label" for="username">Username</label>
                <div class="input-wrapper">
                    <span class="field-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </span>
                    <input class="form-input" id="username" name="username" type="text" placeholder="admin" autocomplete="username" required autofocus />
                </div>
            </div>

            <div class="form-group">
                <label class="form-label" for="password">Password</label>
                <div class="input-wrapper">
                    <span class="field-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </span>
                    <input class="form-input has-toggle" id="password" name="password" type="password" placeholder="Enter password" autocomplete="current-password" required />
                    <button class="toggle-btn" type="button" id="togglePassword" aria-label="Show password">
                        <svg id="eyeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>

            <button class="btn-submit" type="submit">
                <span>Sign In</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </button>
        </form>

        
    </main>

    <script>
        const toggleBtn = document.getElementById('togglePassword');
        const passInput = document.getElementById('password');
        const eyeIcon = document.getElementById('eyeIcon');

        if (toggleBtn && passInput) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passInput.getAttribute('type') === 'password';
                passInput.setAttribute('type', isPassword ? 'text' : 'password');
                toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
                eyeIcon.innerHTML = isPassword
                    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
                    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
            });
        }
    </script>
</body>
</html>`;
}

module.exports = { renderLoginPage };
