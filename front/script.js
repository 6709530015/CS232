/*============================= intial info ========================*/
console.log('Script loaded');
let allTasks = [];
let currentEditingName = "";
let currentTaskId = null;
const grid = document.getElementById('calendarGrid');
const todoSection = document.querySelector('.task-section');
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth(); // 0-based

// Load theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('infiniteAppTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signup.html';
        return false;
    }
    return token;
}

// Load tasks from API
async function loadTasks() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            allTasks = tasks.map(task => ({
                name: task.title,
                date: task.due_date.split('T')[0], // Extract date part
                detail: task.description || '',
                completed: task.status !== 'pending',
                task_id: task.task_id
            }));
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'signup.html';
            return;
        } else {
            console.error('Error loading tasks: Response not ok');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
    
    // Always render, even if tasks failed to load
    renderEverything();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTasks();
});

// Logout
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'signup.html';
});

/*=============================Calendar========================*/
function generateCalendar() {
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
    
    //faded date
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'date-cell muted';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell clickable';
        dateCell.innerText = day;

        //create date format to check in allTask
        const checkDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        //exist task AND uncomplete -> highlight
        const hasActiveTask = allTasks.some(t => t.date === checkDate && t.completed === false);
        
        if (hasActiveTask) {
            dateCell.classList.add('highlight');
        }

        const dateStr = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
        dateCell.addEventListener('click', () => scrollToTask(dateStr));
        grid.appendChild(dateCell);
    }

    const totalCellsNeeded = (firstDay + daysInMonth) > 35 ? 42 : 35;
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
    monthYearElement.textContent = `${monthNames[currentMonth]}, ${currentYear}`;
}

function prevMonth() {
    console.log('Prev month clicked');
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    console.log('New month:', currentMonth, 'Year:', currentYear);
    updateCalendarHeader();
    generateCalendar();
}

function nextMonth() {
    console.log('Next month clicked');
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    console.log('New month:', currentMonth, 'Year:', currentYear);
    updateCalendarHeader();
    generateCalendar();
}

/*=============================edit task and create========================*/
const modal = document.getElementById('taskModal');
const fab = document.querySelector('.fab');
const closeBtn = document.querySelector('.close-btn');
const taskForm = document.getElementById('taskForm');
const toggleBtn = document.getElementById('toggleCompleted');
const completedContainer = document.getElementById('completedTasksContainer');

//update/save task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = checkAuth();
    if (!token) return;

    const name = document.getElementById('taskName').value;
    const date = document.getElementById('taskDate').value;
    const detail = document.getElementById('taskDetail').value;

    const taskData = {
        title: name,
        description: detail,
        due_date: new Date(date).toISOString(),
        status: "pending"
    };

    try {
        let response;
        if (currentTaskId) {
            // Update
                response = await fetch(`/tasks/${currentTaskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            });
        } else {
            // Create
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
            await loadTasks(); // Reload tasks
            modal.style.display = 'none';
            currentEditingName = "";
            currentTaskId = null;
        } else {
            console.error('Error saving task');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function renderEverything() {
    //sorting task
    allTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    //clear old task
    const oldCards = document.querySelectorAll('.task-card');
    oldCards.forEach(card => card.remove());

    //due to status
    allTasks.forEach(task => {
        const [y, m, d] = task.date.split('-');
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.setAttribute('data-detail', task.detail);
        card.innerHTML = `
            <div class="task-info"><span class="circle"></span> ${task.name}</div>
            <div class="task-meta">
                <span>${d}/${m}/${y}</span>
                <span class="delete-icon">🗑️</span>
            </div>
        `;

        if (task.completed) {
            completedContainer.appendChild(card);
        } else {
            todoSection.insertBefore(card, toggleBtn);
        }
    });

    if (grid) {
        generateCalendar();
    }
    updateCompletedCount();
}

//click to look and edit task
document.addEventListener('click', async (e) => {
    //Check/Uncheck
    if (e.target.classList.contains('circle')) {
        const taskCard = e.target.closest('.task-card');
        const title = taskCard.querySelector('.task-info').innerText.trim();
        
        const task = allTasks.find(t => t.name === title);
        if (task) {
            const token = checkAuth();
            if (!token) return;

            const newStatus = task.completed ? "pending" : "completed";
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
        }
        return;
    }

    //Delete task
    if (e.target.classList.contains('delete-icon')) {
        const taskCard = e.target.closest('.task-card');
        const title = taskCard.querySelector('.task-info').innerText.trim();
        const task = allTasks.find(t => t.name === title);
        if (task) {
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
                        await loadTasks(); // Reload tasks
                    }
                } catch (error) {
                    console.error('Error deleting task:', error);
                }
            }
        }
        return;
    }

    //detail+edit
    const taskCard = e.target.closest('.task-card');
    if (taskCard && !e.target.classList.contains('delete-icon')) {
        const title = taskCard.querySelector('.task-info').innerText.trim();
        const taskData = allTasks.find(t => t.name === title);
        if (taskData) {
            currentEditingName = taskData.name;
            currentTaskId = taskData.task_id;
            document.getElementById('modalTitle').innerText = "Edit Task";
            document.getElementById('taskName').value = taskData.name;
            document.getElementById('taskDate').value = taskData.date;
            document.getElementById('taskDetail').value = taskData.detail;
            modal.style.display = 'block';
        }
    }
});

function updateCompletedCount() {
    const count = completedContainer.querySelectorAll('.task-card').length;
    const isHidden = completedContainer.style.display === 'none';
    toggleBtn.innerText = `Completed ${count} ${isHidden ? '▲' : '▼'}`;
}

function scrollToTask(dateString) {
    const tasks = document.querySelectorAll('.task-card');
    
    tasks.forEach(task => {
        const taskDate = task.querySelector('.task-meta span').innerText;
        //change date in card to be DD-MM-YYYY to compare
        const formattedTaskDate = taskDate.replace(/\//g, '-');
        
        // check date AND uncomplete task
        if (formattedTaskDate === dateString && !task.classList.contains('completed')) {
            task.scrollIntoView({ behavior: 'smooth', block: 'center' });
            task.classList.add('task-highlight-active');
            setTimeout(() => task.classList.remove('task-highlight-active'), 2000);
        }
    });
}

fab.addEventListener('click', () => {
    document.getElementById('modalTitle').innerText = "Add New Task";
    taskForm.reset();
    currentEditingName = "";
    currentTaskId = null;
    modal.style.display = 'block';
});

closeBtn.onclick = () => modal.style.display = 'none';

//toggle complete task
toggleBtn.addEventListener('click', () => {
    const isHidden = completedContainer.style.display === 'none';
    completedContainer.style.display = isHidden ? 'block' : 'none';
    updateCompletedCount();
});

allTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

generateCalendar();

//create task
if (typeof renderEverything === "function") {
    renderEverything();
} else {
    refreshTaskList(); 
}
function init() {
    console.log('Init started');
    //all task have to be completed
    allTasks = allTasks.map(task => ({
        ...task,
        completed: task.completed || false
    }));
    renderEverything();
    
    // Calendar navigation - only if buttons exist
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    console.log('prevBtn:', prevBtn, 'nextBtn:', nextBtn);
    if (prevBtn && nextBtn) {
        console.log('Attaching event listeners');
        prevBtn.addEventListener('click', prevMonth);
        nextBtn.addEventListener('click', nextMonth);
        updateCalendarHeader();
    } else {
        console.log('Calendar buttons not found, skipping navigation setup');
    }
    console.log('Init complete');
}

//run initial function
init();