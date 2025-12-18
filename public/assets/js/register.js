/* register.js
   Purpose: LocalStorage-only registration
   Edited: 2025-12-18
*/

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarHidden = document.getElementById('avatarUrl');

  if (avatarInput) {
    avatarInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        avatarHidden.value = ev.target.result;
        avatarPreview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const location = document.getElementById('location').value.trim();
    let role = document.getElementById('role').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    const avatarUrl = avatarHidden.value;

    if (!fullName || !email || !password) {
      alert('Missing required fields');
      return;
    }

    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Email already registered');
      return;
    }

    const normalized = fullName.toLowerCase();
    if (normalized !== 'admin' && normalized !== 'hart') role = 'Standard Member';

    const now = new Date();
    const memberSince = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const user = {
      id: Date.now(),
      fullName,
      email,
      phone,
      location,
      role,
      avatarUrl,
      memberSince,
      password
    };

    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    localStorage.setItem('currentUser', user.fullName);
    localStorage.setItem('profileData', JSON.stringify(user));
    localStorage.setItem('authToken', btoa(JSON.stringify({ id: user.id })));

    window.location.href = '/index.html';
  });
});
