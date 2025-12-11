/* profilePage_fwp.js
  Purpose: client logic for profile display page
  Edited: 2025-12-11
  
  FEATURES:
  - Display logged-in user's profile information
  - Show avatar or initials fallback
  - Populate user details (email, phone, location, member since)
  - Generate dynamic user statistics (vehicles, spending, service records, rating)
  - Auto-redirect unauthenticated users to login
*/

/* ========================================
   PAGE INITIALIZATION
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Retrieve user profile data from localStorage (set during login/registration)
  const profileData = localStorage.getItem('profileData');
  
  // Check if user is logged in
  if (!profileData) {
    alert('No user logged in. Redirecting to login...');
    window.location.href = 'loginPage/loginPage_fwp.html';
    return;
  }

  try {
    const user = JSON.parse(profileData);

    /* ========================================
       PROFILE HEADER - NAME & ROLE
       ======================================== */

    // Display user's full name
    document.getElementById('profile-name').textContent = user.fullName || 'Unknown User';
    
    // Display user's role/designation
    document.getElementById('profile-role').textContent = user.role || 'Standard Member';
    
    // Set avatar element's alt text for accessibility
    const avatarElement = document.getElementById('profile-avatar');
    if (avatarElement) avatarElement.setAttribute('alt', user.fullName || 'Profile avatar');

    /* ========================================
       AVATAR DISPLAY LOGIC
       ======================================== */

    /**
     * showInitials()
     * Fallback display: create circular badge with user's initials
     * Used when avatar URL is missing or image fails to load
     */
    function showInitials() {
      // Remove avatar image from DOM if present
      if (avatarElement && avatarElement.parentNode) {
        try { avatarElement.removeAttribute('src'); } catch (e) {}
        avatarElement.parentNode.removeChild(avatarElement);
      }

      // Avoid creating duplicate initials badges
      if (document.getElementById('profile-initials-div')) return;

      // Generate initials: first letter of each word
      const initials = user.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
        : '?';

      // Create styled initials circle
      const initialsDiv = document.createElement('div');
      initialsDiv.id = 'profile-initials-div';
      initialsDiv.style.cssText = `
        width: 150px;
        height: 150px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #ff6b6b, #f94d6a); /* Red gradient */
        color: white;
        font-size: 48px;
        font-weight: bold;
        box-shadow: 0 0 30px rgba(255, 47, 47, 0.4); /* Glow effect */
        border: 4px solid rgb(255, 47, 47);
        margin-bottom: 20px;
      `;
      initialsDiv.textContent = initials;

      // Insert initials at top of profile header
      const header = document.querySelector('.profile-header');
      if (header) {
        const nameEl = header.querySelector('h2');
        if (nameEl) header.insertBefore(initialsDiv, nameEl);
        else header.insertBefore(initialsDiv, header.firstChild);
      }
    }

    // Handle avatar image or show initials
    if (user.avatarUrl && user.avatarUrl.trim()) {
      // Remove any existing initials placeholder
      const existingInit = document.getElementById('profile-initials-div');
      if (existingInit) existingInit.remove();

      // Re-insert avatar element into DOM if needed
      const header = document.querySelector('.profile-header');
      if (header && avatarElement && !header.contains(avatarElement)) {
        const nameEl = header.querySelector('h2');
        if (nameEl) header.insertBefore(avatarElement, nameEl);
        else header.insertBefore(avatarElement, header.firstChild);
      }

      // Display avatar image
      if (avatarElement) {
        avatarElement.style.display = '';
        avatarElement.src = user.avatarUrl;

        // Fallback to initials if image fails to load
        avatarElement.onerror = function () {
          if (avatarElement.parentNode) avatarElement.parentNode.removeChild(avatarElement);
          showInitials();
        };
      }
    } else {
      // No avatar URL provided - show initials
      showInitials();
    }

    /* ========================================
       USER DETAILS
       ======================================== */

    // Display contact information
    document.getElementById('profile-email').textContent = user.email || '-';
    document.getElementById('profile-phone').textContent = user.phone || '-';
    document.getElementById('profile-location').textContent = user.location || '-';
    
    // Display membership date (formatted as Month Year)
    let memberSinceDate = null;
    if (user.memberSince) {
      const [year, month] = user.memberSince.split('-'); // Parse YYYY-MM format
      memberSinceDate = new Date(year, month - 1); // Create Date object
      const formatted = memberSinceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      document.getElementById('profile-member-since').textContent = formatted;
    } else {
      document.getElementById('profile-member-since').textContent = '-';
    }

    /* ========================================
       USER STATISTICS
       ======================================== */

    // Generate dynamic statistics based on membership duration
    const stats = generateUserStats(memberSinceDate, user.fullName);
    
    // Populate statistics boxes on profile page
    const statBoxes = document.querySelectorAll('.stat-box');
    if (statBoxes.length >= 4) {
      statBoxes[0].innerHTML = `<span class="stat-number">${stats.vehiclesOwned}</span><span class="stat-label">Vehicles Owned</span>`;
      statBoxes[1].innerHTML = `<span class="stat-number">$${stats.totalSpent}</span><span class="stat-label">Total Spent</span>`;
      statBoxes[2].innerHTML = `<span class="stat-number">${stats.serviceRecords}</span><span class="stat-label">Service Records</span>`;
      statBoxes[3].innerHTML = `<span class="stat-number">${stats.rating}★</span><span class="stat-label">Rating</span>`;
    }

  } catch (err) {
    console.error('Error loading profile:', err);
    alert('Error loading profile data');
    window.location.href = 'loginPage/loginPage_fwp.html';
  }
});

/* ========================================
   STATISTIC GENERATION
   ======================================== */

/**
 * generateUserStats()
 * Creates realistic, deterministic statistics based on:
 * - User's name (used as seed for consistency)
 * - Membership duration (longer members have more activity)
 * 
 * @param {Date} memberSinceDate - Date when user joined
 * @param {string} fullName - User's full name
 * @returns {Object} Statistics: vehiclesOwned, totalSpent, serviceRecords, rating
 */
function generateUserStats(memberSinceDate, fullName) {
  // Generate seed from user's name (same user always gets same stats)
  const seed = fullName ? fullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  
  // Cap membership date to Dec 31, 2020 to avoid unrealistic stats
  const capDate = new Date(2020, 11, 31);
  if (memberSinceDate && memberSinceDate > capDate) {
    memberSinceDate = capDate;
  }

  // Calculate how many months user has been a member
  const today = new Date();
  const monthsAsMember = memberSinceDate 
    ? Math.max(1, Math.floor((today - memberSinceDate) / (1000 * 60 * 60 * 24 * 30)))
    : 12;

  // Generate seeded random numbers for variation within consistent bounds
  const random1 = (seed * 9.2 % 1) * 0.3;
  const random2 = (seed * 7.3 % 1) * 0.3;
  const random3 = (seed * 5.1 % 1) * 0.3;

  /* Vehicles Owned */
  // Base: 2-5 vehicles (from seed), increased by 1 for every year of membership
  const baseVehicles = Math.floor(2 + (seed % 4));
  const vehiclesOwned = Math.min(8, baseVehicles + Math.floor(monthsAsMember / 12));

  /* Total Spent */
  // $250k-$750k per vehicle, multiplied by owned vehicles, scaled by randomness and membership
  const pricePerVehicle = 250000 + (seed % 500000);
  const totalSpent = Math.floor((vehiclesOwned * pricePerVehicle * (0.8 + random1)) / 100000) * 100;

  /* Service Records */
  // ~3 services per vehicle + 1 per month of membership
  const serviceRecords = Math.floor(vehiclesOwned * 3 + monthsAsMember / 4);

  /* Rating */
  // 4.5-5.0 stars (loyal long-term members score higher)
  const ratingValue = 4.5 + (random2 * 0.5);
  const rating = ratingValue.toFixed(1);

  // Return statistics formatted for display
  return {
    vehiclesOwned,
    totalSpent: (totalSpent / 1000000).toFixed(1) + 'M', // Format as millions
    serviceRecords,
    rating
  };
}

