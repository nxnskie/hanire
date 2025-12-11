/* register.js
  Purpose: registration page client-side logic (avatar preview, validation)
  Edited: 2025-12-11
  
  FEATURES:
  - Handle avatar upload from file or URL
  - Real-time avatar preview
  - Form validation (required fields, password matching)
  - Duplicate email checking
  - User registration with localStorage persistence
  - Role locking (only 'admin' and 'Hart' can set custom roles)
  - Generate authentication token
*/

/* ========================================
   PAGE INITIALIZATION - WAIT FOR DOM
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Get form and input elements
  const form = document.getElementById('register-form');
  const avatarInput = document.getElementById('avatarInput'); // File upload input
  const avatarPreview = document.getElementById('avatar-preview'); // Preview container
  const avatarUrl = document.getElementById('avatarUrl'); // Hidden field storing image data/URL
  const avatarUrlInput = document.getElementById('avatarUrlInput'); // Manual URL input
  
  if (!form) return;

  /* ========================================
     AVATAR HANDLING - FILE UPLOAD
     ======================================== */

  // Handle file selection from user's computer
  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Convert file to data URL using FileReader
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result; // Base64-encoded image data
          avatarUrl.value = dataUrl; // Store in hidden field
          
          // Display image in preview box
          avatarPreview.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Avatar preview">`;
        };
        reader.readAsDataURL(file); // Convert file to base64
      }
    });
  }

  /* ========================================
     AVATAR HANDLING - URL INPUT
     ======================================== */

  // Handle manual image URL entry
  if (avatarUrlInput) {
    avatarUrlInput.addEventListener('blur', () => {
      const url = avatarUrlInput.value.trim();
      if (url) {
        avatarUrl.value = url; // Store URL
        
        // Display image from URL with fallback error message
        avatarPreview.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='Invalid image URL'">`;
      }
    });
  }

  /* ========================================
     FORM SUBMISSION & VALIDATION
     ======================================== */

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Get all form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const location = document.getElementById('location').value.trim();
    let role = document.getElementById('role').value;
    const avatarUrlValue = document.getElementById('avatarUrl').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    /* Validate Required Fields */
    if (!fullName || !email || !password) {
      alert('Please complete required fields (name, email, password).');
      return;
    }
    
    /* Validate Password Match */
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }

    /* Check for Duplicate Email */
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const emailExists = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      alert('Email already registered');
      return;
    }

    /* Generate Member Since Date */
    // Format: YYYY-MM (e.g., 2025-12)
    const now = new Date();
    const memberSince = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    /* Role Locking - Security Feature */
    // Only 'admin' and 'Hart' can set custom roles; others forced to 'Standard Member'
    const normalized = fullName.toLowerCase();
    if (!(normalized === 'admin' || normalized === 'hart')) {
      role = 'Standard Member';
    }

    /* Create User Object */
    const newUser = {
      id: Date.now(), // Unique ID based on timestamp
      fullName,
      email,
      phone: phone || '',
      location: location || '',
      role: role || 'Standard Member',
      avatarUrl: avatarUrlValue || '', // Base64 or URL
      memberSince: memberSince,
      password: password // WARNING: Never store plain passwords in production!
    };

    /* Save to LocalStorage */
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    /* Generate Auth Token */
    // Simple token format (not production-safe): base64-encoded object with expiry
    const authToken = btoa(JSON.stringify({ 
      id: newUser.id, 
      email: newUser.email, 
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // Expires in 7 days
    }));

    /* Store Session Data */
    localStorage.setItem('currentUser', newUser.fullName); // Username
    localStorage.setItem('profileData', JSON.stringify(newUser)); // Full user object
    localStorage.setItem('authToken', authToken); // Token for API calls

    alert('Account created successfully. Redirecting...');
    window.location.href = 'index.html'; // Redirect to home page
  });

  /* ========================================
     ROLE SELECT STYLING
     ======================================== */

  // Ensure role dropdown displays selected value in red for emphasis
  const roleSelect = document.getElementById('role');
  if (roleSelect) {
    const wrapper = roleSelect.closest('.select-wrapper') || roleSelect.parentElement;
    
    /**
     * updateRoleDisplay()
     * Keeps selected role text visible in red
     */
    function updateRoleDisplay() {
      roleSelect.style.color = 'rgb(255,47,47)'; // Red text for emphasis
    }
    
    // Update color on any change/blur
    roleSelect.addEventListener('change', updateRoleDisplay);
    roleSelect.addEventListener('blur', updateRoleDisplay);
    
    // Add visual feedback when focusing
    roleSelect.addEventListener('focus', () => wrapper && wrapper.classList.add('select-open'));
    roleSelect.addEventListener('blur', () => wrapper && wrapper.classList.remove('select-open'));
    
    // Initialize
    updateRoleDisplay();
  }
});
