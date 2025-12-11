/* navbar.js
    Purpose: inject navbar fragment into pages and initialize user menu
    Edited: 2025-12-11
    
    FEATURES:
    - Dynamically loads navbar.html into all pages
    - Handles user authentication state (logged in vs logged out)
    - Displays user profile picture or initials badge
    - Manages user dropdown menu with logout button
    - Protects profile/settings pages - redirects unauthenticated users to login
    - Implements mobile hamburger menu with dropdown toggle
    - Stores/retrieves user data from localStorage
*/

/* ========================================
   PAGE INITIALIZATION - LOAD NAVBAR
   ======================================== */

// Wait for DOM to load, then fetch and inject navbar.html into every page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch the navbar component HTML
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            // Look for existing nav element
            let navContainer = document.querySelector('nav');
            if (navContainer) {
                // Replace existing nav with fetched navbar
                navContainer.outerHTML = data;
            } else {
                // If no nav exists, insert at beginning of body
                document.body.insertAdjacentHTML('afterbegin', data);
            }
            
            // Initialize user menu after navbar is loaded into DOM
            initUserMenu();
        })
        .catch(error => console.log('Error loading navbar:', error));
});

/* ========================================
   USER MENU INITIALIZATION
   ======================================== */

/**
 * initUserMenu()
 * Sets up all user menu functionality:
 * - Displays logged-in user info or Login prompt
 * - Handles user dropdown toggle
 * - Manages logout functionality
 * - Protects auth-required pages
 * - Sets up mobile hamburger menu
 */
function initUserMenu() {
    // DOM element references
    const userBtn = document.getElementById('user-btn');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameDisplay = document.getElementById('username-display');
    
    // Get user data from localStorage (set during login/registration)
    const currentUser = localStorage.getItem('currentUser');
    const profileData = localStorage.getItem('profileData');
    let avatarUrl = null;
    
    // Extract avatar URL from profile data if available
    if (profileData) {
        try {
            const user = JSON.parse(profileData);
            avatarUrl = user.avatarUrl;
        } catch (e) {}
    }

    /* ========================================
       UTILITY FUNCTIONS
       ======================================== */

    /**
     * initialsFrom()
     * Generates initials from a name
     * Examples: "John Smith" → "JS", "Alice" → "A"
     */
    function initialsFrom(name) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/); // Split on whitespace
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    /**
     * colorFromName()
     * Generates consistent color from a string
     * Same name always produces same color (based on hash)
     * Returns HSL color string for initials badge background
     */
    function colorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360; // Hue: 0-360
        const s = 70; // Saturation: 70%
        const l = 45; // Lightness: 45%
        return `hsl(${h} ${s}% ${l}%)`;
    }

    /* ========================================
       HANDLE LOGGED IN STATE
       ======================================== */

    if (currentUser) {
        // User is logged in — display profile info
        if (usernameDisplay) {
            if (avatarUrl && avatarUrl.trim()) {
                // Case 1: User has profile picture - display it
                usernameDisplay.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${avatarUrl}" alt="${currentUser}" class="user-avatar-img">
                        <span class="user-name">${currentUser}</span>
                    </div>`;
                
                const avatarImg = usernameDisplay.querySelector('.user-avatar-img');
                
                // Style the image to be circular
                if (avatarImg) {
                    avatarImg.style.width = '28px';
                    avatarImg.style.height = '28px';
                    avatarImg.style.borderRadius = '50%';
                    avatarImg.style.objectFit = 'cover';

                    // If image fails to load, replace with initials badge
                    avatarImg.onerror = function () {
                        this.style.display = 'none'; // Hide broken image
                        
                        // Create fallback initials badge
                        const span = document.createElement('span');
                        span.className = 'user-initials-fallback';
                        span.textContent = initialsFrom(currentUser);
                        span.style.width = '28px';
                        span.style.height = '28px';
                        span.style.display = 'inline-flex';
                        span.style.alignItems = 'center';
                        span.style.justifyContent = 'center';
                        span.style.borderRadius = '50%';
                        span.style.background = colorFromName(currentUser);
                        span.style.color = 'white';
                        span.style.fontWeight = '700';
                        span.style.fontSize = '13px';
                        
                        this.parentNode.insertBefore(span, this.nextSibling);
                    };

                    // If image loads successfully, ensure no duplicate initials
                    avatarImg.onload = function () {
                        const existing = usernameDisplay.querySelector('.user-initials-fallback');
                        if (existing) existing.remove();
                        this.style.display = '';
                    };
                }
            } else {
                // Case 2: No profile picture - display initials badge instead
                const initials = initialsFrom(currentUser);
                usernameDisplay.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="user-initials">${initials}</span>
                        <span class="user-name">${currentUser}</span>
                    </div>`;
                
                // Style initials badge with deterministic color
                const initialsEl = usernameDisplay.querySelector('.user-initials');
                if (initialsEl) {
                    initialsEl.style.background = colorFromName(currentUser);
                }
            }
        }
        
        // Toggle dropdown menu when user button clicked
        if (userBtn) {
            userBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (userMenu) userMenu.classList.toggle('show');
            });
        }
    } else {
        // User not logged in — show "Login" link
        if (usernameDisplay) usernameDisplay.textContent = 'Login';
        if (userBtn) {
            // Clicking "Login" redirects to login page
            userBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'loginPage/loginPage_fwp.html';
            });
        }
    }
    
    /* ========================================
       DROPDOWN MENU MANAGEMENT
       ======================================== */
    
    // Close user dropdown when clicking outside of it
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-dropdown')) {
            userMenu.classList.remove('show');
        }
    });
    
    /* ========================================
       LOGOUT FUNCTIONALITY
       ======================================== */
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear all user session data from localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('profileData');
            localStorage.removeItem('currentUserAvatar');
            
            // Redirect to login page
            window.location.href = 'loginPage/loginPage_fwp.html';
        });
    }
    
    /* ========================================
       AUTHENTICATION PROTECTION
       ======================================== */
    
    // Protect profile page - redirect unauthenticated users to login
    const profileLink = document.querySelector('a[href="profilePage_fwp.html"]');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            if (!currentUser) {
                e.preventDefault();
                window.location.href = 'loginPage/loginPage_fwp.html';
            }
        });
    }
    
    // Protect settings page - redirect unauthenticated users to login
    const settingsLink = document.querySelector('a[href="settingsPage_fwp.html"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            if (!currentUser) {
                e.preventDefault();
                window.location.href = 'loginPage/loginPage_fwp.html';
            }
        });
    }
    
    /* ========================================
       MOBILE HAMBURGER MENU
       ======================================== */
    
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburgerMenu && navMenu) {
        // Toggle hamburger menu open/close on click
        hamburgerMenu.addEventListener('click', function() {
            hamburgerMenu.classList.toggle('active'); // Animate hamburger icon
            navMenu.classList.toggle('active'); // Show/hide menu
        });
        
        // Close menu when a navigation link is clicked
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Don't close if clicking dropdown parent (e.g., SHOP)
                const dropdownParent = link.closest('.dropdown');
                if (!dropdownParent) {
                    hamburgerMenu.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });
        
        // Handle dropdown toggle for mobile
        const dropdownParents = navMenu.querySelectorAll('.dropdown');
        dropdownParents.forEach(dropdown => {
            const dropdownLink = dropdown.querySelector('a');
            if (dropdownLink) {
                dropdownLink.addEventListener('click', function(e) {
                    // Only prevent default and toggle on mobile (≤ 700px)
                    if (window.innerWidth <= 700) {
                        e.preventDefault();
                        dropdown.classList.toggle('active'); // Show/hide dropdown items
                    }
                });
            }
        });
        
        // Close menu when clicking outside of navbar
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || hamburgerMenu.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

