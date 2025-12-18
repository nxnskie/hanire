/* editProfile.js
  Purpose: edit profile page client logic (avatar upload, save)
  Edited: 2025-12-11
*/

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('edit-profile-form');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarUrl = document.getElementById('avatarUrl');
  const avatarUrlInput = document.getElementById('avatarUrlInput');

  // Check if user is logged in
  const profileData = localStorage.getItem('profileData');
  if (!profileData) {
    alert('You must be logged in to edit your profile');
    window.location.href = 'loginPage/loginPage_fwp.html';
    return;
  }

  // Load current profile data
  const user = JSON.parse(profileData);
  document.getElementById('fullName').value = user.fullName || '';
  document.getElementById('email').value = user.email || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('location').value = user.location || '';
  document.getElementById('role').value = user.role || 'Standard Member';
  avatarUrl.value = user.avatarUrl || '';

  // Display current avatar
  if (user.avatarUrl && user.avatarUrl.trim()) {
    avatarPreview.innerHTML = `<img src="${user.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='Click to change'">`;
  }

  // Handle file upload
  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          avatarUrl.value = dataUrl;
          avatarPreview.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle URL input
  if (avatarUrlInput) {
    avatarUrlInput.addEventListener('blur', () => {
      const url = avatarUrlInput.value.trim();
      if (url) {
        avatarUrl.value = url;
        avatarPreview.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='Invalid image URL'">`;
      }
    });
  }

  // Allow clicking on avatar preview to upload
  avatarPreview.addEventListener('click', () => {
    avatarInput.click();
  });

  // Handle remove avatar button
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Clear stored avatar values in the form
        avatarUrl.value = '';
        if (avatarUrlInput) avatarUrlInput.value = '';

        // Render initials immediately in the preview
        const name = (document.getElementById('fullName') && document.getElementById('fullName').value) || user.fullName || '';
        const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

        // Remove any existing image inside preview
        avatarPreview.innerHTML = '';
        const initialsDiv = document.createElement('div');
        initialsDiv.style.cssText = `width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff6b6b, #f94d6a); color: white; font-size: 32px; font-weight: 700; box-shadow: 0 6px 18px rgba(249, 77, 106, 0.25);`;
        initialsDiv.textContent = initials;
        avatarPreview.appendChild(initialsDiv);

        // Persist change immediately so navbar/profile reflect removal without form submit
        try {
          // Update profileData in localStorage
          const stored = JSON.parse(localStorage.getItem('profileData') || '{}');
          if (stored) {
            stored.avatarUrl = '';
            localStorage.setItem('profileData', JSON.stringify(stored));
          }

          // Update the users array if present
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const idx = users.findIndex(u => u.id === user.id);
          if (idx !== -1) {
            users[idx].avatarUrl = '';
            localStorage.setItem('users', JSON.stringify(users));
          }

          // Refresh navbar display if available
          if (typeof initUserMenu === 'function') {
            try { initUserMenu(); } catch (err) { /* ignore */ }
          }
        } catch (err) {
          console.error('Error persisting avatar removal:', err);
        }
      });
  }

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const location = document.getElementById('location').value.trim();
    let role = document.getElementById('role').value;
    const avatarUrlValue = document.getElementById('avatarUrl').value.trim();

    if (!fullName || !email) {
      alert('Please complete required fields');
      return;
    }

    // Update user data
    // Enforce role locking: only 'admin' and 'Hart' accounts may keep/change non-standard roles
    const originalName = (user.fullName || '').toLowerCase();
    const normalizedNewName = fullName.toLowerCase();
    if (!(originalName === 'admin' || originalName === 'hart' || normalizedNewName === 'admin' || normalizedNewName === 'hart')) {
      role = 'Standard Member';
    }

    const updatedUser = {
      ...user,
      fullName,
      email,
      phone,
      location,
      role,
      avatarUrl: avatarUrlValue
    };

    // Update localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
    }

    localStorage.setItem('profileData', JSON.stringify(updatedUser));
    localStorage.setItem('currentUser', fullName);

    alert('Profile updated successfully!');
    window.location.href = 'profilePage_fwp.html';
  });

  // Ensure role select displays selected value with red text (match register)
  const roleSelectEP = document.getElementById('role');
  if (roleSelectEP) {
    const wrapperEP = roleSelectEP.closest('.select-wrapper') || roleSelectEP.parentElement;
    function updateRoleDisplayEP() {
      roleSelectEP.style.color = 'rgb(255,47,47)';
    }
    roleSelectEP.addEventListener('change', updateRoleDisplayEP);
    roleSelectEP.addEventListener('blur', updateRoleDisplayEP);
    roleSelectEP.addEventListener('focus', () => wrapperEP && wrapperEP.classList.add('select-open'));
    roleSelectEP.addEventListener('blur', () => wrapperEP && wrapperEP.classList.remove('select-open'));
    updateRoleDisplayEP();
  }
});
