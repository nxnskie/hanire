/* loginPage_fwp.js
   Purpose: LocalStorage-only login system
   Edited: 2025-12-18
*/

document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-btn');

  // Seed admin account if users do not exist
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([{
      id: 'admin',
      fullName: 'Admin',
      email: 'admin@local',
      phone: '',
      location: '',
      role: 'Administrator',
      avatarUrl: '',
      memberSince: '2020-01',
      password: 'admin'
    }]));
  }

  submitBtn.addEventListener('click', (event) => {
    event.preventDefault();

    const identifier = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!identifier || !password) {
      alert('Please enter email and password');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    let user = null;

    if (identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@local') {
      user = users.find(u => u.id === 'admin');
    } else {
      if (!identifier.includes('@')) {
        alert('Please log in using your email address');
        return;
      }
      user = users.find(u => u.email.toLowerCase() === identifier.toLowerCase());
    }

    if (!user || user.password !== password) {
      alert('Invalid login credentials');
      return;
    }

    // Role sanitization
    users.forEach(u => {
      const n = (u.fullName || '').toLowerCase();
      if (n !== 'admin' && n !== 'hart') u.role = 'Standard Member';
    });
    localStorage.setItem('users', JSON.stringify(users));

    const token = btoa(JSON.stringify({
      id: user.id,
      email: user.email,
      exp: Date.now() + 7 * 86400000
    }));

    localStorage.setItem('currentUser', user.fullName);
    localStorage.setItem('profileData', JSON.stringify(user));
    localStorage.setItem('authToken', token);

    window.location.href = '/index.html';
  });
});
