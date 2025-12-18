document.addEventListener('DOMContentLoaded', () => {
  const data = localStorage.getItem('profileData');
  if (!data) {
    window.location.href = 'loginPage/loginPage_fwp.html';
    return;
  }

  const user = JSON.parse(data);

  document.getElementById('profile-name').textContent = user.fullName;
  document.getElementById('profile-role').textContent = user.role;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-phone').textContent = user.phone || '-';
  document.getElementById('profile-location').textContent = user.location || '-';
  document.getElementById('profile-member-since').textContent = user.memberSince;

  const avatar = document.getElementById('profile-avatar');

  function showInitials() {
    if (avatar) avatar.remove();
    if (document.getElementById('profile-initials-div')) return;

    const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    const div = document.createElement('div');
    div.id = 'profile-initials-div';
    div.style.cssText =
      'width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'background:#ff4d4d;color:#fff;font-size:48px;font-weight:bold;margin-bottom:20px;';
    div.textContent = initials;

    document.querySelector('.profile-header').prepend(div);
  }

  if (user.avatarUrl) {
    avatar.src = user.avatarUrl;
    avatar.onerror = showInitials;
  } else showInitials();
});
