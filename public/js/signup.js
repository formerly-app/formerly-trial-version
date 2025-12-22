document.addEventListener('DOMContentLoaded', function() {
    // Password toggle functionality
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#password');
    const toggleConfirmPassword = document.querySelector('#toggleConfirmPassword');
    const confirmPassword = document.querySelector('#confirmPassword');
    const form = document.querySelector('.signup-form');

    // Toggle password visibility
    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Toggle eye icons
        const eyeIcons = button.querySelectorAll('svg');
        eyeIcons.forEach(icon => icon.classList.toggle('hidden'));
    }

    // Add event listeners for password toggle
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            togglePasswordVisibility(password, togglePassword);
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            togglePasswordVisibility(confirmPassword, toggleConfirmPassword);
        });
    }

    // Form validation
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Reset previous error messages
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            document.querySelectorAll('.form-input').forEach(input => {
                input.classList.remove('error');
            });

            let isValid = true;
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const passwordValue = password.value;
            const confirmPasswordValue = confirmPassword.value;

            // Name validation
            if (name === '') {
                showError('name', 'Name is required');
                isValid = false;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('email', 'Please enter a valid email address');
                isValid = false;
            }

            // Password validation
            if (passwordValue.length < 8) {
                showError('password', 'Password must be at least 8 characters long');
                isValid = false;
            }

            // Confirm password validation
            if (passwordValue !== confirmPasswordValue) {
                showError('confirmPassword', 'Passwords do not match');
                isValid = false;
            }

            // If form is valid, submit it
            if (isValid) {
                this.submit();
            }
        });
    }

    // Show error message
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Add error class to input
        field.classList.add('error');

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = 'var(--destructive)';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        errorElement.textContent = message;

        // Insert error message after the input's parent
        const parent = field.parentElement;
        parent.parentNode.insertBefore(errorElement, parent.nextSibling);
    }
});
