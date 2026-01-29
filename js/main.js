        // Theme Toggle
        document.addEventListener('DOMContentLoaded', function() {
            const themeToggle = document.querySelector('.theme-toggle');
            const themeBtns = document.querySelectorAll('.theme-btn');
            const body = document.body;
            
            // Initialize theme
            const savedTheme = localStorage.getItem('verivote-theme') || 'dark';
            body.setAttribute('data-theme', savedTheme);
            updateThemeButtons(savedTheme);
            
            // Theme toggle functionality
            themeBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const theme = this.getAttribute('data-theme');
                    body.setAttribute('data-theme', theme);
                    localStorage.setItem('verivote-theme', theme);
                    updateThemeButtons(theme);
                });
            });
            
            function updateThemeButtons(activeTheme) {
                themeBtns.forEach(btn => {
                    if (btn.getAttribute('data-theme') === activeTheme) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
            
            // Smooth scroll for navigation
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Navbar scroll effect
            window.addEventListener('scroll', function() {
                const navbar = document.querySelector('.navbar');
                if (window.scrollY > 50) {
                    navbar.style.padding = '0.5rem 0';
                    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                } else {
                    navbar.style.padding = '1rem 0';
                    navbar.style.boxShadow = 'none';
                }
            });
            
            // Launch App button
            document.querySelectorAll('.btn-primary-custom, .btn-light-custom').forEach(btn => {
                btn.addEventListener('click', function() {
                    // In a real implementation, this would launch your dApp
                    window.location = 'main.html';
                });
            });
        });