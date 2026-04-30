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

  const STORAGE_KEY = 'anim_project_v1';
  const freeTrialOverlay = document.getElementById('free-trial-overlay');
  const freeTrialWidth = document.getElementById('free-trial-width');
  const freeTrialHeight = document.getElementById('free-trial-height');
  const freeTrialCreate = document.getElementById('free-trial-create');
  const freeTrialCancel = document.getElementById('free-trial-cancel');
  const freeTrialLinks = document.querySelectorAll('a[data-free-trial]');

  function updateFreeTrialButtonText(isContinue) {
    freeTrialLinks.forEach(function(link) {
      Array.from(link.childNodes).forEach(function(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) {
          node.nodeValue = isContinue ? 'Continue' : 'Try once for free';
        }
      });
    });
  }

  function openFreeTrialOverlay(event) {
    if (event) {
      event.preventDefault();
    }
    if (!freeTrialOverlay) return;
    freeTrialOverlay.classList.add('visible');
    freeTrialWidth.value = '800';
    freeTrialHeight.value = '600';
    freeTrialWidth.focus();
  }

  function closeFreeTrialOverlay() {
    if (!freeTrialOverlay) return;
    freeTrialOverlay.classList.remove('visible');
  }

  const hasSavedProject = typeof window.localStorage !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) !== null;
  if (hasSavedProject) {
    updateFreeTrialButtonText(true);
  } else {
    freeTrialLinks.forEach(function(link) {
      link.addEventListener('click', openFreeTrialOverlay);
    });
  }

  if (freeTrialCancel) {
    freeTrialCancel.addEventListener('click', closeFreeTrialOverlay);
  }

  if (freeTrialOverlay) {
    freeTrialOverlay.addEventListener('click', function(event) {
      if (event.target === freeTrialOverlay) {
        closeFreeTrialOverlay();
      }
    });
  }

  if (freeTrialCreate) {
    freeTrialCreate.addEventListener('click', function() {
      const widthValue = parseInt(freeTrialWidth.value, 10);
      const heightValue = parseInt(freeTrialHeight.value, 10);
      const width = Number.isFinite(widthValue) && widthValue > 0 ? widthValue : 800;
      const height = Number.isFinite(heightValue) && heightValue > 0 ? heightValue : 600;
      window.location.href = '/editor/free?width=' + width + '&height=' + height;
    });
  }
});
