const registerForm = document.getElementById('registerForm');
const loginLink = document.getElementById('loginLink');
const registerBtn = document.getElementById('registerBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Clear messages
function clearMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Validate password
function validatePassword(password, confirmPassword) {
    if (password.length < 6) {
        return 'Password must be at least 6 characters long';
    }
    
    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }
    
    return null;
}

// Register process
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    clearMessages();
    
    // Validate inputs
    const passwordError = validatePassword(password, confirmPassword);
    if (passwordError) {
        showError(passwordError);
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Registration successful
            showSuccess('Account created successfully! Redirecting to login...');
            registerForm.reset();
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            // Registration failed
            showError('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Server error! Please try again.');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
});