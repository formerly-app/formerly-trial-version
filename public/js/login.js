// Simple client-side validation and password visibility toggle for login
(function(){
  const form = document.querySelector('.signup-form');
  const toggle = document.getElementById('togglePassword');
  const pwd = document.getElementById('password');

  function togglePasswordVisibility() {
    if (!pwd) return;
    if (pwd.type === 'password') {
      pwd.type = 'text';
      toggle && toggle.querySelector('.eye-icon') && toggle.querySelector('.eye-icon').classList.add('hidden');
      toggle && toggle.querySelector('.eye-off-icon') && toggle.querySelector('.eye-off-icon').classList.remove('hidden');
    } else {
      pwd.type = 'password';
      toggle && toggle.querySelector('.eye-icon') && toggle.querySelector('.eye-icon').classList.remove('hidden');
      toggle && toggle.querySelector('.eye-off-icon') && toggle.querySelector('.eye-off-icon').classList.add('hidden');
    }
  }

  if (toggle) toggle.addEventListener('click', togglePasswordVisibility);

  if (!form) return;
  form.addEventListener('submit', function(e){
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    let hasError = false;
    // clear previous inline errors
    document.querySelectorAll('.error-message.client').forEach(n=>n.remove());

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      const msg = document.createElement('div'); msg.className = 'error-message client'; msg.textContent = 'Enter a valid email';
      email && email.classList.add('error'); email && email.parentNode.appendChild(msg); hasError = true;
    }
    if (!password || password.value.length < 8) {
      const msg = document.createElement('div'); msg.className = 'error-message client'; msg.textContent = 'Password must be at least 8 characters';
      password && password.classList.add('error'); password && password.parentNode.appendChild(msg); hasError = true;
    }
    if (hasError) e.preventDefault();
  });
})();
