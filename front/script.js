/*============================= initial info ========================*/
const allTasks = [];
let currentTaskId = null;
const grid = document.getElementById('calendarGrid');
const todoSection = document.querySelector('.task-section');
const modal = document.getElementById('taskModal');
const fab = document.querySelector('.fab');
const closeBtn = document.querySelector('.close-btn');
const taskForm = document.getElementById('taskForm');
const toggleBtn = document.getElementById('toggleCompleted');
const completedContainer = document.getElementById('completedTasksContainer');
const taskListPlaceholder = document.getElementById('taskListPlaceholder');
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth(); // 0-based

function loadTheme() {
    const savedTheme = localStorage.getItem('infiniteAppTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
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

async function loadTasks() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const tasks = await response.json();
            allTasks.length = 0;
            tasks.forEach(task => {
                allTasks.push({
                    name: task.title,
                    date: task.due_date ? task.due_date.split('T')[0] : '',
                    detail: task.description || '',
                    completed: task.status !== 'pending',
                    task_id: task.task_id,
                });
            });
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'signup.html';
            return;
        } else {
            console.error('Error loading tasks:', response.status);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }

    renderEverything();
}

function generateCalendar() {
    if (!grid) return;
    grid.innerHTML = '';
    const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    labels.forEach(label => {
        const div = document.createElement('div');
        div.className = 'day-label';
        div.innerText = label;
        grid.appendChild(div);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'date-cell muted';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell clickable';
        dateCell.innerText = day;

        const checkDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasActiveTask = allTasks.some(t => t.date === checkDate && !t.completed);
        if (hasActiveTask) {
            dateCell.classList.add('highlight');
        }

        const dateStr = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
        dateCell.addEventListener('click', () => scrollToTask(dateStr));
        grid.appendChild(dateCell);
    }

    const totalCellsNeeded = firstDay + daysInMonth > 35 ? 42 : 35;
    const remainingCells = totalCellsNeeded - (firstDay + daysInMonth);
    for (let j = 1; j <= remainingCells; j++) {
        const nextMonthCell = document.createElement('div');
        nextMonthCell.className = 'date-cell muted';
        nextMonthCell.innerText = j;
        grid.appendChild(nextMonthCell);
    }
}

function updateCalendarHeader() {
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const monthYearElement = document.getElementById('monthYear');
    if (monthYearElement) {
        monthYearElement.textContent = `${monthNames[currentMonth]}, ${currentYear}`;
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateCalendarHeader();
    generateCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateCalendarHeader();
    generateCalendar();
}

function createTaskCard(task) {
    const [y, m, d] = task.date.split('-');
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.taskId = task.task_id;
    card.innerHTML = `
        <div class="task-info"><span class="circle"></span> ${task.name}</div>
        <div class="task-meta">
            <span>${d}/${m}/${y}</span>
            <span class="delete-icon">🗑️</span>
        </div>
    `;
    return card;
}

function renderEverything() {
    const pendingTasks = allTasks.filter(task => !task.completed);
    const completedTasks = allTasks.filter(task => task.completed);

    document.querySelectorAll('.task-card').forEach(card => card.remove());
    completedContainer.innerHTML = '';

    pendingTasks.forEach(task => {
        const card = createTaskCard(task);
        if (toggleBtn) {
            todoSection.insertBefore(card, toggleBtn);
        }
    });

    completedTasks.forEach(task => {
        const card = createTaskCard(task);
        completedContainer.appendChild(card);
    });

    if (taskListPlaceholder) {
        taskListPlaceholder.style.display = allTasks.length === 0 ? 'block' : 'none';
    }

    if (completedTasks.length === 0) {
        completedContainer.style.display = 'none';
    }

    updateCompletedCount();
    generateCalendar();
}

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = checkAuth();
    if (!token) return;

    const name = document.getElementById('taskName').value.trim();
    const date = document.getElementById('taskDate').value;
    const detail = document.getElementById('taskDetail').value.trim();

    const taskData = {
        title: name,
        description: detail,
        due_date: new Date(date).toISOString(),
        status: 'pending',
    };

    try {
        let response;
        if (currentTaskId) {
            response = await fetch(`/tasks/${currentTaskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            });
        } else {
            response = await fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            });
        }

        if (response.ok) {
            await loadTasks();
            modal.style.display = 'none';
            currentTaskId = null;
        } else {
            console.error('Error saving task:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.addEventListener('click', async (e) => {
    const taskCard = e.target.closest('.task-card');
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;
    const task = allTasks.find(t => String(t.task_id) === String(taskId));
    if (!task) return;

    if (e.target.classList.contains('delete-icon')) {
        const token = checkAuth();
        if (!token) return;

        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`/tasks/${task.task_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    await loadTasks();
                }
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
        return;
    }

    if (e.target.classList.contains('circle')) {
        const token = checkAuth();
        if (!token) return;

        const newStatus = task.completed ? 'pending' : 'completed';
        try {
            const response = await fetch(`/tasks/${task.task_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                task.completed = !task.completed;
                renderEverything();
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
        return;
    }

    if (!e.target.classList.contains('delete-icon') && !e.target.classList.contains('circle')) {
        currentTaskId = task.task_id;
        document.getElementById('modalTitle').innerText = 'Edit Task';
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskDetail').value = task.detail;
        modal.style.display = 'block';
    }
});

function updateCompletedCount() {
    const count = completedContainer.querySelectorAll('.task-card').length;
    const isHidden = completedContainer.style.display === 'none';
    if (toggleBtn) {
        toggleBtn.innerText = `Completed ${count} ${isHidden ? '▲' : '▼'}`;
    }
}

function scrollToTask(dateString) {
    document.querySelectorAll('.task-card').forEach(task => {
        const taskDate = task.querySelector('.task-meta span')?.innerText;
        if (!taskDate) return;
        const formattedTaskDate = taskDate.replace(/\//g, '-');
        if (formattedTaskDate === dateString && !task.classList.contains('completed')) {
            task.scrollIntoView({ behavior: 'smooth', block: 'center' });
            task.classList.add('task-highlight-active');
            setTimeout(() => task.classList.remove('task-highlight-active'), 2000);
        }
    });
}

if (fab) {
    fab.addEventListener('click', () => {
        document.getElementById('modalTitle').innerText = 'Add New Task';
        taskForm.reset();
        currentTaskId = null;
        modal.style.display = 'block';
    });
}

if (closeBtn) {
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        currentTaskId = null;
    };
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const isHidden = completedContainer.style.display === 'none';
        completedContainer.style.display = isHidden ? 'block' : 'none';
        updateCompletedCount();
    });
}

function init() {
    if (!checkAuth()) return;
    loadTheme();
    loadTasks();

    //logout สำหรับ main.html
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'signup.html';
        });
    }

    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', prevMonth);
        nextBtn.addEventListener('click', nextMonth);
    }
    updateCalendarHeader();
}

document.addEventListener('DOMContentLoaded', init);
