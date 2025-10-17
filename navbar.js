// Reusable navigation bar component
document.addEventListener('DOMContentLoaded', function() {
    const navbarHTML = `
        <nav>
            <a href="index.html" class="logo">
                <img src="public/icons/icon.png" alt="Spectril Logo" class="logo-img">
                <span>Spectril</span>
            </a>
            <ul class="nav-links">
                <li><a href="index.html" class="nav-link" data-page="index">Home</a></li>
                <li><a href="hardware.html" class="nav-link" data-page="hardware">The Hardware</a></li>
                <li><a href="about.html" class="nav-link" data-page="about">About Us</a></li>
            </ul>
            <ul class="nav-links-mobile">
                <li><a href="https://github.com/sponsors/MikeyBoi-N" class="sponsor-button">Sponsor Me!</a></li>
            </ul>
            <div class="hamburger">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </nav>
    `;
    
    const header = document.querySelector('header');
    if (header) {
        header.innerHTML = navbarHTML;
        
        // Set active state based on current page
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('data-page');
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
        
        // Initialize hamburger menu functionality
        const hamburger = document.querySelector('.hamburger');
        const navMobile = document.querySelector('.nav-links-mobile');
        
        if (hamburger && navMobile) {
            hamburger.addEventListener('click', () => {
                navMobile.classList.toggle('active');
                hamburger.classList.toggle('toggle');
            });
        }
    }
});