/* navbar.js
   Purpose: Dynamically inject navbar and handle all page routing via JavaScript
   Features:
   - Auto-detect current page location (root vs app/views/)
   - Route all navbar links correctly based on location
   - Handle user authentication state
   - Mobile hamburger menu
   Edited: 2025-12-18
*/

/* ========================================
   GLOBAL ROUTING HELPER
   ======================================== */

function getPageLocation() {
    const pathname = window.location.pathname;
    return {
        isRoot: !pathname.includes('/app/views/'),
        isViews: pathname.includes('/app/views/'),
        pathname
    };
}

window.navigateToPage = function (targetPage) {
    const location = getPageLocation();
    let href;

    if (targetPage === 'index.html') {
        href = '/index.html';
    } else if (targetPage === 'login.html') {
        href = '/app/views/login.html';
    } else {
        href = location.isRoot
            ? `./app/views/${targetPage}`
            : `./${targetPage}`;
    }

    window.location.href = href;
};

var navigateToPage = window.navigateToPage;

/* ========================================
   LOAD NAVBAR
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    const paths = [
        '/public/assets/navbar.html',
        '../../public/assets/navbar.html',
        'navbar.html',
        '../navbar.html'
    ];

    (function tryFetch(index = 0) {
        if (index >= paths.length) return;

        fetch(paths[index])
            .then(res => res.ok ? res.text() : Promise.reject())
            .then(html => {
                const nav = document.querySelector('nav');
                if (nav) nav.outerHTML = html;
                else document.body.insertAdjacentHTML('afterbegin', html);

                attachNavbarLinkHandlers();
                initUserMenu();
            })
            .catch(() => tryFetch(index + 1));
    })();
});

/* ========================================
   NAVBAR LINK HANDLERS
   ======================================== */

function attachNavbarLinkHandlers() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    nav.querySelectorAll('a[data-target]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            navigateToPage(link.dataset.target);
        }, true);
    });
}

/* ========================================
   USER MENU INITIALIZATION
   ======================================== */

function initUserMenu() {
    const userBtn = document.getElementById('user-btn');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const loginLink = document.getElementById('login-link');
    const profileLink = document.getElementById('profile-link');
    const settingsLink = document.getElementById('settings-link');
    const usernameDisplay = document.getElementById('username-display');

    const currentUser = localStorage.getItem('currentUser');
    const profileDataRaw = localStorage.getItem('profileData');

    let displayName = currentUser;
    let avatarUrl = null;

    if (profileDataRaw) {
        try {
            const profile = JSON.parse(profileDataRaw);
            displayName = profile.fullName || currentUser;
            avatarUrl = profile.avatarUrl || null;
        } catch {
            console.warn('[Navbar] Invalid profileData');
        }
    }

    function initialsFrom(name) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        return parts.length === 1
            ? parts[0][0].toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    }

    function colorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${Math.abs(hash) % 360} 70% 45%)`;
    }

    /* ---------- LOGGED IN ---------- */

    if (currentUser) {
        if (usernameDisplay) {
            if (avatarUrl) {
                usernameDisplay.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;">
                        <img src="${avatarUrl}" alt="${displayName}" class="user-avatar-img">
                        <span class="user-name">${displayName}</span>
                    </div>`;
            } else {
                const initials = initialsFrom(displayName);
                usernameDisplay.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="user-initials">${initials}</span>
                        <span class="user-name">${displayName}</span>
                    </div>`;
                usernameDisplay.querySelector('.user-initials').style.background =
                    colorFromName(displayName);
            }
        }

        profileLink && (profileLink.style.display = 'block');
        settingsLink && (settingsLink.style.display = 'block');
        logoutBtn && (logoutBtn.style.display = 'block');
        loginLink && (loginLink.style.display = 'none');

        userBtn && (userBtn.onclick = () => userMenu?.classList.toggle('show'));

        profileLink?.addEventListener('click', e => {
            e.preventDefault();
            navigateToPage('profile.html');
        });

        settingsLink?.addEventListener('click', e => {
            e.preventDefault();
            navigateToPage('settings.html');
        });
    }

    /* ---------- NOT LOGGED IN ---------- */

    else {
        usernameDisplay && (usernameDisplay.textContent = 'Login');
        profileLink && (profileLink.style.display = 'none');
        settingsLink && (settingsLink.style.display = 'none');
        logoutBtn && (logoutBtn.style.display = 'none');
        loginLink && (loginLink.style.display = 'block');

        userBtn && (userBtn.onclick = () => navigateToPage('login.html'));
        loginLink?.addEventListener('click', e => {
            e.preventDefault();
            navigateToPage('login.html');
        });
    }

    /* ---------- GLOBAL ---------- */

    document.addEventListener('click', e => {
        if (!e.target.closest('.user-dropdown')) {
            userMenu?.classList.remove('show');
        }
    });

    /* ---------- SAFE LOGOUT (FIXED) ---------- */

    logoutBtn?.addEventListener('click', e => {
        e.preventDefault();

        // DO NOT DELETE REGISTERED USERS
        localStorage.removeItem('currentUser');
        localStorage.removeItem('profileData');
        localStorage.removeItem('authToken');

        navigateToPage('login.html');
    });

    /* ---------- MOBILE ---------- */

    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.onclick = () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        };

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}
