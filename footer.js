// Reusable footer component
document.addEventListener('DOMContentLoaded', function() {
    const footerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h4>Mailing Address</h4>
                <p> Spectril Labs </p>
                <p>12345 Scientists Cliffs,</p>
                <p>Calvert County, MD, USA 20764</p>
            </div>
            <div class="footer-section">
                <h4>Contact</h4>
                <p>Michael Nehring</p>
                <p>Founder & Principal Engineer</p>
                <p>Email: mika.nehring@gmail.com</p>
                <p>Phone: (801)-884-3316</p>
            </div>
            <div class="footer-section">
                <h4>Social Media</h4>
                <ul>
                    <li><a href="#">Threads</a></li>
                    <li><a href="#">LinkedIn</a></li>
                    <li><a href="#">GitHub</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <ul>
                    <li><a href="#">Careers</a></li>
                    <li><a href="blog.html">Blog</a></li>
                    <li><a href="#">Leadership</a></li>
                    <li><a href="https://github.com/sponsors/MikeyBoi-N">Sponsors</a></li>
                    <li><a href="about.html">About Us</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2025 Spectril Labs. All rights reserved.</p>
        </div>
    `;
    
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = footerHTML;
    }
});