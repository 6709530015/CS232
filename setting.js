        function GoToHome() {
            window.location.href = "main.html";
        }

        // --- Tab Switching Logic ---
        function switchTab(tabName) {
            // 1. Remove 'active' class from all menu items
            document.getElementById('nav-account').classList.remove('active');
            document.getElementById('nav-theme').classList.remove('active');

            // 2. Remove 'active' class from all content cards
            document.getElementById('content-account').classList.remove('active');
            document.getElementById('content-theme').classList.remove('active');

            // 3. Add 'active' class to the clicked menu item and corresponding content card
            document.getElementById('nav-' + tabName).classList.add('active');
            document.getElementById('content-' + tabName).classList.add('active');

            // 4. Save the active tab to local storage!
            localStorage.setItem('infiniteAppActiveTab', tabName);
        }

        // --- Theme Toggle Logic ---
        function setTheme(mode) {
            const body = document.body;
            const statusText = document.getElementById('theme-status-text');
            const lightSwatch = document.querySelector('.swatch.light');
            const darkSwatch = document.querySelector('.swatch.dark');

            // Save the chosen theme to local storage
            localStorage.setItem('infiniteAppTheme', mode);

            // Apply the theme classes
            if (mode === 'dark') {
                body.classList.add('dark-theme');
                statusText.textContent = 'Dark';
                darkSwatch.classList.add('active');
                lightSwatch.classList.remove('active');
            } else {
                body.classList.remove('dark-theme');
                statusText.textContent = 'Light';
                lightSwatch.classList.add('active');
                darkSwatch.classList.remove('active');
            }
        }

        // --- Load Saved Settings on Page Load ---
        window.onload = function() {
            // 1. Check for saved theme and apply it (defaults to 'light')
            const savedTheme = localStorage.getItem('infiniteAppTheme') || 'light';
            setTheme(savedTheme);

            // 2. Check for saved tab and apply it (defaults to 'account')
            const savedTab = localStorage.getItem('infiniteAppActiveTab') || 'account';
            switchTab(savedTab);
        };
        