/*============================= intial info ========================*/
let allTasks = [
    { name: "CS222 Algorithm", date: "2026-03-27", detail: "Focus on Dynamic Programming" },
    { name: "CS271 OS", date: "2026-03-28", detail: "Study Thread and Process" }
];
let currentEditingName = "";
const grid = document.getElementById('calendarGrid');
const todoSection = document.querySelector('.task-section');
const year = 2026;
const month = 2; // March

/*=============================Calendar========================*/
function generateCalendar(y, m) {
    grid.innerHTML = ''; 
    const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    labels.forEach(label => {
        const div = document.createElement('div');
        div.className = 'day-label';
        div.innerText = label;
        grid.appendChild(div);
    });

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
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
        const checkDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        //exist task AND uncomplete -> highlight
        const hasActiveTask = allTasks.some(t => t.date === checkDate && t.completed === false);
        
        if (hasActiveTask) {
            dateCell.classList.add('highlight');
        }

        const dateStr = `${String(day).padStart(2, '0')}-${String(m + 1).padStart(2, '0')}-${y}`;
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

/*=============================edit task and create========================*/
const modal = document.getElementById('taskModal');
const fab = document.querySelector('.fab');
const closeBtn = document.querySelector('.close-btn');
const taskForm = document.getElementById('taskForm');
const toggleBtn = document.getElementById('toggleCompleted');
const completedContainer = document.getElementById('completedTasksContainer');

//update/save task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('taskName').value;
    const date = document.getElementById('taskDate').value;
    const detail = document.getElementById('taskDetail').value;

    const existingIndex = allTasks.findIndex(t => t.name === currentEditingName);
    if (existingIndex !== -1) {
        allTasks[existingIndex] = { ...allTasks[existingIndex], name, date, detail };
    } else {
        allTasks.push({ name, date, detail, completed: false });
    }

    renderEverything();
    modal.style.display = 'none';
    currentEditingName = "";
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

    generateCalendar(year, month);
    updateCompletedCount();
}

//click to look and edit task
document.addEventListener('click', (e) => {
    //Check/Uncheck
    if (e.target.classList.contains('circle')) {
        const taskCard = e.target.closest('.task-card');
        const title = taskCard.querySelector('.task-info').innerText.trim();
        
        //update status in array
        const task = allTasks.find(t => t.name === title);
        if (task) {
            task.completed = !task.completed;
            renderEverything(); //task ascending+highlight+update
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

generateCalendar(year, month);

//create task
if (typeof renderEverything === "function") {
    renderEverything();
} else {
    refreshTaskList(); 
}
function init() {
    //all task have to be completed
    allTasks = allTasks.map(task => ({
        ...task,
        completed: task.completed || false
    }));
    renderEverything();
}

//run initial function
init();