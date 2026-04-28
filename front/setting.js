function GoToHome() {
    window.location.href = "main.html";
}

function switchTab(tabName) {
    document.getElementById('nav-account').classList.remove('active');
    document.getElementById('nav-theme').classList.remove('active');

    document.getElementById('content-account').classList.remove('active');
    document.getElementById('content-theme').classList.remove('active');

    document.getElementById('nav-' + tabName).classList.add('active');
    document.getElementById('content-' + tabName).classList.add('active');

    localStorage.setItem('infiniteAppActiveTab', tabName);
}

function applyTheme(mode) {
    const body = document.body;
    const statusText = document.getElementById('theme-status-text');
    const lightSwatch = document.querySelector('.swatch.light');
    const darkSwatch = document.querySelector('.swatch.dark');

    localStorage.setItem('infiniteAppTheme', mode);

    if (mode === 'dark') {
        body.classList.add('dark-theme');
        if (statusText) statusText.textContent = 'Dark';
        if (darkSwatch) darkSwatch.classList.add('active');
        if (lightSwatch) lightSwatch.classList.remove('active');
    } else {
        body.classList.remove('dark-theme');
        if (statusText) statusText.textContent = 'Light';
        if (lightSwatch) lightSwatch.classList.add('active');
        if (darkSwatch) darkSwatch.classList.remove('active');
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signup.html';
        return null;
    }
    return token;
}

async function fetchSettings() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/settings', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error('Could not load settings:', response.status);
            return;
        }

        const settings = await response.json();
        applyTheme(settings.theme || 'light');
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateSettings(settings) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/settings', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            console.error('Could not save settings:', response.status);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

function setTheme(mode) {
    applyTheme(mode);
    updateSettings({ theme: mode });
}

function initSettingsPage() {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'signup.html';
        });
    }

    const savedTab = localStorage.getItem('infiniteAppActiveTab') || 'account';
    switchTab(savedTab);
    fetchSettings();
}

window.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;
    initSettingsPage();
});

