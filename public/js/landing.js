// ==========================================
// Motion Landing Page - Vanilla JavaScript
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      const isOpen = !mobileMenu.classList.contains('hidden');
      
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
      } else {
        mobileMenu.classList.remove('hidden');
        menuIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
      }
    });

    // Close mobile menu when clicking on a link
    const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
      });
    });
  }

  // Set current year in footer
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Smooth scroll for anchor links (fallback for older browsers)
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Password toggle functionality
  // Password toggle functionality
  // Avoid attaching duplicate toggle handlers on pages that include a dedicated
  // `signup.js` (which manages its own password toggle). If a signup form
  // exists, skip adding these listeners here.
  if (!document.querySelector('.signup-form')) {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const eyeIcon = togglePassword.querySelector('.eye-icon');
        const eyeOffIcon = togglePassword.querySelector('.eye-off-icon');
        
        if (type === 'text') {
          eyeIcon.classList.add('hidden');
          eyeOffIcon.classList.remove('hidden');
        } else {
          eyeIcon.classList.remove('hidden');
          eyeOffIcon.classList.add('hidden');
        }
      });
    }

    if (toggleConfirmPassword && confirmPasswordInput) {
      toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        
        const eyeIcon = toggleConfirmPassword.querySelector('.eye-icon');
        const eyeOffIcon = toggleConfirmPassword.querySelector('.eye-off-icon');
        
        if (type === 'text') {
          eyeIcon.classList.add('hidden');
          eyeOffIcon.classList.remove('hidden');
        } else {
          eyeIcon.classList.remove('hidden');
          eyeOffIcon.classList.add('hidden');
        }
      });
    }
  }
});
