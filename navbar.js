// Navbar user state management
(function() {
    // Function to get user initials
    function getUserInitials(name) {
        if (!name) return 'U';

        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        // Take first letter of first name and first letter of last name
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Function to update navbar based on login state
    function updateNavbar() {
        const userStr = localStorage.getItem('user');
        const loginLink = document.querySelector('.nav-menu a[href="login.html"]');

        if (!loginLink) return;

        const parentLi = loginLink.parentElement;

        if (userStr) {
            // User is logged in
            const user = JSON.parse(userStr);
            const initials = getUserInitials(user.name);

            // Create user initials circle
            parentLi.innerHTML = `
                <a href="dashboard.html" class="user-initials-link" title="${user.name}">
                    <span class="user-initials">${initials}</span>
                </a>
            `;
        } else {
            // User is not logged in
            parentLi.innerHTML = '<a href="login.html">LOGIN</a>';
        }
    }

    // Update navbar when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavbar);
    } else {
        updateNavbar();
    }

    // Listen for storage changes (logout in another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'user') {
            updateNavbar();
        }
    });
})();
