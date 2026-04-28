function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signup.html';
        return null;
    }
    return token;
}

function applyThemeFromStorage() {
    const mode = localStorage.getItem('infiniteAppTheme') || 'light';
    if (mode === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

function createNotificationCard(notification) {
    const card = document.createElement('div');
    card.className = 'notification-card';
    card.innerHTML = `
        <div class="notification-title">${notification.message}</div>
        <div class="notification-meta">
            <span>Task ID: ${notification.task_id}</span>
            <span>${new Date(notification.notify_date).toLocaleDateString()}</span>
        </div>
    `;
    return card;
}

async function loadNotifications() {
    const token = checkAuth();
    if (!token) return;

    const container = document.getElementById('notificationContainer');
    if (!container) return;

    try {
        const response = await fetch('/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            container.innerHTML = '<p class="empty-state">Unable to load notifications.</p>';
            return;
        }

        const notifications = await response.json();
        container.innerHTML = '';

        if (!Array.isArray(notifications) || notifications.length === 0) {
            container.innerHTML = '<p class="empty-state">No notifications at the moment.</p>';
            return;
        }

        notifications.forEach((notification) => {
            container.appendChild(createNotificationCard(notification));
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<p class="empty-state">Network error while loading notifications.</p>';
    }
}

function initNotificationPage() {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'signup.html';
        });
    }

    applyThemeFromStorage();
    loadNotifications();
}

window.addEventListener('DOMContentLoaded', initNotificationPage);
