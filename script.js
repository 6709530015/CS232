/*=============================Main========================*/
/*=====Calendar===========*/
const grid = document.getElementById('calendarGrid');
const year = 2026;
const month = 2; //Third month = March ; Array start at 0, Jan = 0, Feb = 1

function generateCalendar(y, m) {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'date-cell muted';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        
        //format DD-MM-YYYY
        const dateStr = `${String(day).padStart(2, '0')}-${String(m + 1).padStart(2, '0')}-${y}`;
        
        dateCell.className = 'date-cell clickable';
        dateCell.innerText = day;
        dateCell.setAttribute('data-date', dateStr);

        //Highlight the day that has task
        if (day === 27 || day === 28) {
            dateCell.classList.add('highlight');
        }
        grid.appendChild(dateCell);
    }
    const totalCells = 35; 
    const currentCells = firstDay + daysInMonth;
    const remainingCells = totalCells - currentCells;
    for (let j = 1; j <= remainingCells; j++) {
        const nextMonthCell = document.createElement('div');
        nextMonthCell.className = 'date-cell muted';
        nextMonthCell.innerText = j;
        grid.appendChild(nextMonthCell);
    }
}

generateCalendar(year, month);
const totalCells = 35; //in case we have the day of the next month
const remainingCells = totalCells - (firstDay + daysInMonth);
for (let j = 1; j <= remainingCells; j++) {
    const nextMonthCell = document.createElement('div');
    nextMonthCell.className = 'date-cell muted';
    nextMonthCell.innerText = j;
    grid.appendChild(nextMonthCell);
}