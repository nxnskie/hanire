/* loginPage_fwp.js
  Purpose: login page interactions and carousel
  Edited: 2025-12-11
  
  FEATURES:
  - User authentication with username/email and password
  - Hardcoded admin login (admin/admin)
  - Role sanitization (lock standard users to 'Standard Member')
  - Authentication token generation
  - Interactive image carousel with auto-play
  - Touch/pointer swipe support for mobile
  - Carousel dot navigation
*/

/* ========================================
   LOGIN FORM SUBMISSION
   ======================================== */

document.getElementById("submit-btn").addEventListener("click", function(event) {
  event.preventDefault(); // Prevent default form refresh

  // Get login credentials from form
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;

  // Validate required fields
  if (!usernameInput || !passwordInput) {
    alert('Please enter both username and password');
    return;
  }

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  /* ========================================
     AUTHENTICATION LOGIC
     ======================================== */

  let loginUser = null;
  
  // Check for hardcoded admin login (convenience for development)
  if (usernameInput.toLowerCase() === 'admin' && passwordInput === 'admin') {
    // Find or create admin user in database
    let adminUser = users.find(u => u.id === 'admin' || (u.fullName && u.fullName.toLowerCase() === 'admin'));
    if (!adminUser) {
      // Auto-create admin if doesn't exist
      adminUser = {
        id: 'admin',
        fullName: 'admin',
        email: 'admin@local',
        phone: '',
        location: '',
        role: 'Administrator',
        avatarUrl: '',
        memberSince: '2020-01',
        password: 'admin'
      };
      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
    }
    loginUser = adminUser;
  } else {
    // Search for user by fullName or email (case-insensitive)
    loginUser = users.find(u => 
      (u.fullName && u.fullName.toLowerCase() === usernameInput.toLowerCase()) || 
      (u.email && u.email.toLowerCase() === usernameInput.toLowerCase())
    );
  }

  // Check if user found
  if (!loginUser) {
    alert('Login failed: Invalid credentials');
    return;
  }

  // Verify password (plain text comparison)
  if (loginUser.password !== passwordInput) {
    alert('Login failed: Invalid credentials');
    return;
  }

  /* ========================================
     ROLE SANITIZATION
     ======================================== */

  /**
   * sanitizeRoles()
   * Security feature: only 'admin' and 'Hart' can have custom roles
   * Everyone else is forced to 'Standard Member'
   */
  function sanitizeRoles(list) {
    let changed = false;
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      const name = (u.fullName || '').toLowerCase();
      // Check if user is NOT admin or Hart
      if (name !== 'admin' && name !== 'hart') {
        // Force role to Standard Member if different
        if (u.role && u.role !== 'Standard Member') {
          u.role = 'Standard Member';
          changed = true;
        }
      }
    }
    return changed;
  }

  // Apply sanitization and save if modified
  const changed = sanitizeRoles(users);
  if (changed) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Refresh loginUser from database in case it was modified
  const refreshed = users.find(u => (u.id === loginUser.id) || (u.fullName && u.fullName.toLowerCase() === loginUser.fullName.toLowerCase()));
  if (refreshed) loginUser = refreshed;

  /* ========================================
     SESSION CREATION
     ======================================== */

  // Generate authentication token (simple base64-encoded expiring token)
  const authToken = btoa(JSON.stringify({ 
    id: loginUser.id, 
    email: loginUser.email, 
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // Expires in 7 days
  }));

  // Store user session in localStorage
  localStorage.setItem('currentUser', loginUser.fullName);
  localStorage.setItem('profileData', JSON.stringify(loginUser));
  localStorage.setItem('authToken', authToken);

  alert('Login successful!');
  window.location.href = '../index.html'; // Redirect to home page
});

/* ========================================
   CAROUSEL IMPLEMENTATION
   ======================================== */

/**
 * Self-contained carousel with:
 * - Auto-play every 4 seconds
 * - Manual next/prev buttons
 * - Dot navigation
 * - Touch/pointer swipe support
 * - Pause on hover
 */
(function() {
  // Get DOM elements
  const carousel = document.querySelector('.carousel');
  if (!carousel) return; // Exit if no carousel found
  
  const slidesWrap = carousel.querySelector('.carousel-slides');
  const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  
  // State
  let index = 0; // Current slide index
  let intervalId = null; // Auto-play interval ID

  /* ========================================
     SLIDE NAVIGATION
     ======================================== */

  /**
   * goTo(i)
   * Navigate to slide at index i (with wrapping)
   */
  function goTo(i) {
    index = (i + slides.length) % slides.length; // Wrap around
    slidesWrap.style.transform = `translateX(${ -index * 100 }%)`; // Slide view
    updateDots(); // Highlight current dot
  }

  function next() { goTo(index + 1); } // Go to next slide
  function prev() { goTo(index - 1); } // Go to previous slide

  /* ========================================
     DOT NAVIGATION
     ======================================== */

  // Create dot button for each slide
  slides.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', `Go to slide ${i+1}`);
    btn.addEventListener('click', () => { 
      goTo(i); // Jump to clicked slide
      resetAutoplay(); // Reset auto-play timer
    });
    dotsContainer.appendChild(btn);
  });

  /**
   * updateDots()
   * Highlight the dot corresponding to current slide
   */
  function updateDots() {
    const buttons = Array.from(dotsContainer.children);
    buttons.forEach((b, i) => b.classList.toggle('active', i === index));
  }

  /* ========================================
     BUTTON CONTROLS
     ======================================== */

  // Previous button
  if (prevBtn) {
    prevBtn.addEventListener('click', () => { 
      prev(); 
      resetAutoplay(); 
    });
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener('click', () => { 
      next(); 
      resetAutoplay(); 
    });
  }

  /* ========================================
     AUTO-PLAY MANAGEMENT
     ======================================== */

  function startAutoplay() {
    stopAutoplay(); // Clear existing interval
    intervalId = setInterval(next, 4000); // Advance every 4 seconds
  }

  function stopAutoplay() { 
    if (intervalId) { 
      clearInterval(intervalId); 
      intervalId = null; 
    } 
  }

  function resetAutoplay() { 
    stopAutoplay(); 
    startAutoplay(); // Restart from 4 seconds
  }

  // Pause carousel on mouse hover, resume on mouse leave
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  /* ========================================
     TOUCH/POINTER SWIPE SUPPORT
     ======================================== */

  let startX = 0; // Initial touch/pointer X position
  let currentX = 0; // Current X position
  let isDragging = false; // Drag state
  const threshold = 50; // Minimum pixels for swipe detection

  /**
   * onPointerDown()
   * User starts dragging on touch or mouse
   */
  function onPointerDown(e) {
    isDragging = true;
    // Support both touch and mouse/pointer events
    startX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    currentX = startX;
    stopAutoplay(); // Stop auto-play during interaction
  }

  /**
   * onPointerMove()
   * User drags - provide visual feedback by partially translating slides
   */
  function onPointerMove(e) {
    if (!isDragging) return;
    // Get current position from touch or pointer
    const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    currentX = x;
    
    // Calculate drag distance and apply as partial translation
    const delta = currentX - startX;
    slidesWrap.style.transform = `translateX(${ -index * 100 + (delta / slidesWrap.clientWidth) * 100 }%)`;
  }

  /**
   * onPointerUp()
   * User releases drag - decide whether to advance, go back, or snap to current
   */
  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    
    const delta = currentX - startX;
    
    // Check if swipe distance exceeds threshold
    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        // Swiped left - show next slide
        next();
      } else {
        // Swiped right - show previous slide
        prev();
      }
    } else {
      // Swipe too short - snap back to current slide
      goTo(index);
    }
    
    // Restart auto-play
    startAutoplay();
  }

  /* ========================================
     EVENT LISTENERS - TOUCH & POINTER
     ======================================== */

  // Touch events (mobile)
  carousel.addEventListener('touchstart', onPointerDown, { passive: true });
  carousel.addEventListener('touchmove', onPointerMove, { passive: true });
  carousel.addEventListener('touchend', onPointerUp);
  
  // Pointer/mouse events (desktop & modern mobile)
  carousel.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  /* ========================================
     INITIALIZATION
     ======================================== */

  goTo(0); // Start at first slide
  startAutoplay(); // Begin auto-play
})();
