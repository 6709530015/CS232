const API_BASE = window.location.origin;
const TOKEN_KEY = 'token';

/*===================== Sign up ================================*/
const signInBtn = document.getElementById("signInBtn");

if (signInBtn) {
    signInBtn.onclick = async function () {
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        // เช็คเบื้องต้นว่ากรอกข้อมูลครบไหม
        if (!email || !password) {
            showToast("⚠️ กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน", "error");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' // ตรวจสอบว่าตรงกับ Backend
            },
            body: new URLSearchParams({
                'username': email, // FastAPI ใช้ field นี้เป็นมาตรฐาน
                'password': password
            }).toString() // เพิ่ม .toString() เพื่อความชัวร์ในการส่ง
        });

            if (response.ok) {
                // กรณีรหัสผ่านถูกต้อง
                const data = await response.json();
                localStorage.setItem(TOKEN_KEY, data.access_token);
                showToast("✅ เข้าสู่ระบบสำเร็จ!", "success");
                
                setTimeout(() => {
                    window.location.href = "main.html";
                }, 1000);

            } else {
                // กรณีรหัสผ่านผิด หรือ User ไม่มีในระบบ
                const errorData = await response.json();
                // errorData.detail คือข้อความที่ส่งมาจาก FastAPI เช่น "Incorrect username or password"
                showToast(`❌ ${errorData.detail || "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่"}`, "error");
            }

        } catch (error) {
            console.error("Login Error:", error);
            showToast("🌐 ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
        }
    };
}
//Toggle password
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('loginPassword');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        // สลับ type ระหว่าง password และ text
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // สลับไอคอนระหว่าง eye และ eye-slash
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}
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
//Verify the url, be able to click the link directly
function linkify(text) {
    if (!text) return "";
    // Regex สำหรับค้นหา URL
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    
    return text.replace(urlPattern, function(url) {
        // คืนค่าเป็นแท็ก <a> เพื่อให้คลิกได้ และเปิด Tab ใหม่ (target="_blank")
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #7FBDFF; text-decoration: underline;">${url}</a>`;
    });
}

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
        const detailHTML = linkify(task.detail);
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.setAttribute('data-detail', task.detail);
        card.innerHTML = `
            <div class="task-info"><span class="circle"></span> ${task.name}</div>
            <div class="task-meta">
                <span>${d}/${m}/${y}</span>
                <div class="task-actions">
                        <span class="icon delete-btn" onclick="deleteTask('${task.name}')">
                            <i class="fa-regular fa-trash-can"></i>
                        </span>
                </div>
                <div class="task-info">
                    <h3>${task.name}</h3>
                    <p class="task-detail">${detailHTML}</p> 
                </div>
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
// ฟังก์ชันลบ Task
function deleteTask(taskName) {
    if (confirm(`คุณต้องการลบ " ${taskName} " ใช่หรือไม่?`)) {
        // 1. กรองเอาเฉพาะ Task ที่ชื่อไม่ตรงกับตัวที่เลือก (ลบออกจาก Array)
        allTasks = allTasks.filter(task => task.name !== taskName);

        // 2. สั่งวาดรายการใหม่ทันที
        if (typeof renderEverything === "function") {
            renderEverything();
        } else {
            refreshTaskList();
        }

        // 3. (Optional) ถ้ามีแจ้งเตือน Toast ให้ใช้ด้วย
        if (typeof showToast === "function") {
            showToast("🗑️ ลบรายการสำเร็จ", "success");
        }
    }
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



//-----------------(setting)-----------------------
/* =============================================
   HELPERS
============================================= */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'show ' + type;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.className = ''; }, 2800);
}

/* =============================================
   NAVIGATION
============================================= */
function GoToHome() {
    window.location.href = 'main.html';
}

function GoToSetting() {
    window.location.href = 'setting.html';
}

function switchTab(tab) {
    ['account', 'theme', 'reminder'].forEach(t => {
        document.getElementById('nav-' + t).classList.remove('active');
        document.getElementById('content-' + t).classList.remove('active');
    });
    document.getElementById('nav-' + tab).classList.add('active');
    document.getElementById('content-' + tab).classList.add('active');
    localStorage.setItem('infiniteAppActiveTab', tab);
}

/* =============================================
   THEME
============================================= */
// Function to apply theme
function setTheme(mode) {
    document.body.classList.toggle('dark-theme', mode === 'dark');
    
    // Update UI elements only if they exist on the current page
    const statusText = document.getElementById('theme-status-text');
    if (statusText) statusText.textContent = mode === 'dark' ? 'Dark' : 'Light';
    
    const lightSw = document.getElementById('sw-light');
    const darkSw = document.getElementById('sw-dark');
    if (lightSw) lightSw.classList.toggle('active', mode !== 'dark');
    if (darkSw) darkSw.classList.toggle('active', mode === 'dark');
    
    // Save to localStorage
    localStorage.setItem('infiniteAppTheme', mode);
}

// RUN THIS ON EVERY PAGE LOAD
(function initTheme() {
    const savedTheme = localStorage.getItem('infiniteAppTheme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Optional: Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }
})();

/* =============================================
   LOAD USER DATA FROM API
   FastAPI endpoint ที่ต้องการ:
   GET /users/me  → { first_name, middle_name, last_name, email }
   Header: Authorization: Bearer <token>
============================================= */
async function loadUserData() {
    const token = getToken();
    if (!token) {
        // ถ้าไม่มี token ให้กลับไป login
        window.location.href = 'signup.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (res.status === 401) {
            // Token หมดอายุ
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = 'signup.html';
            return;
        }

        if (!res.ok) throw new Error('Failed to load user data');

        const user = await res.json();

        // กรอกข้อมูลลง form
        document.getElementById('input-firstname').value   = user.first_name   || '';
        document.getElementById('input-middlename').value  = user.middle_name  || '';
        document.getElementById('input-lastname').value    = user.last_name    || '';
        document.getElementById('input-email').value       = user.email        || '';

        // ถ้ามีรูป profile
        if (user.profile_picture) {
            const preview = document.getElementById('avatar-preview');
            preview.innerHTML = `<img src="${user.profile_picture}" alt="avatar">`;
        }

    } catch (err) {
        console.error('loadUserData error:', err);
        // ถ้า backend ยังไม่พร้อม → โหลดจาก localStorage แทน (fallback)
        const saved = JSON.parse(localStorage.getItem('userProfile') || '{}');
        document.getElementById('input-firstname').value  = saved.first_name  || '';
        document.getElementById('input-middlename').value = saved.middle_name || '';
        document.getElementById('input-lastname').value   = saved.last_name   || '';
        document.getElementById('input-email').value      = saved.email       || '';
    }
}

/* =============================================
   SAVE ACCOUNT
   FastAPI endpoint ที่ต้องการ:
   PUT /users/me  → body: { first_name, middle_name, last_name, email }
   Header: Authorization: Bearer <token>
============================================= */
async function saveAccount() {
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const body = {
        first_name:   document.getElementById('input-firstname').value.trim(),
        middle_name:  document.getElementById('input-middlename').value.trim(),
        last_name:    document.getElementById('input-lastname').value.trim(),
        email:        document.getElementById('input-email').value.trim(),
    };

    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('Save failed');

        // บันทึก fallback ใน localStorage ด้วย
        localStorage.setItem('userProfile', JSON.stringify(body));
        showToast('✅ Saved successfully!', 'success');

    } catch (err) {
        console.error('saveAccount error:', err);
        // Fallback: บันทึกแค่ localStorage ก่อน (ใช้ได้เมื่อ backend ยังไม่พร้อม)
        localStorage.setItem('userProfile', JSON.stringify(body));
        showToast('⚠️ Saved locally (backend not connected yet)', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save changes';
    }
}

/* =============================================
   AVATAR PREVIEW
============================================= */
function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const preview = document.getElementById('avatar-preview');
    preview.innerHTML = `<img src="${url}" alt="avatar">`;
    // TODO: upload ไฟล์ไปยัง API ด้วย FormData เมื่อ backend พร้อม
}

/* =============================================
   SAVE REMINDER
============================================= */
function saveReminder() {
    const days = document.getElementById('reminder-days').value;
    localStorage.setItem('reminderDays', days);
    showToast(`✅ Reminder set to ${days} days`, 'success');
    // TODO: PUT /users/me/reminder { days_before: days }  เมื่อ backend พร้อม
}

/* =============================================
   LOGOUT
   FastAPI: ปกติแค่ลบ token ฝั่ง client ได้เลย
   ถ้า backend มี POST /auth/logout ก็เรียกก่อน
============================================= */
async function handleLogout() {
    if (!confirm('Log out?')) return;

    try {
        // ถ้า FastAPI มี endpoint logout → uncomment บรรทัดนี้
        // await fetch(`${API_BASE}/auth/logout`, { method:'POST', headers: authHeaders() });
    } catch (_) {}

    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'signup.html';
}

/* =============================================
   INIT
============================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme is already handled by your IIFE (initTheme), 
    // but we ensure UI elements match here.
    const savedTheme = localStorage.getItem('infiniteAppTheme') || 'light';
    setTheme(savedTheme);

    // 2. Load Tab
    const savedTab = localStorage.getItem('infiniteAppActiveTab') || 'account';
    const navElement = document.getElementById('nav-' + savedTab);
    if (navElement) {
        switchTab(savedTab);
    }

    // 3. Load Reminders
    const reminderInput = document.getElementById('reminder-days');
    if (reminderInput) {
        const savedDays = localStorage.getItem('reminderDays') || '3';
        reminderInput.value = savedDays;
    }

    // 4. Load User Data
    loadUserData();
});