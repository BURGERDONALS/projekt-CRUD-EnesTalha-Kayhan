// API Configuration
const API_BASE_URL = 'https://projekt-crud-enestalha-kayhan.onrender.com';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const loginLink = document.getElementById('loginLink');
const registerBtn = document.getElementById('registerBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const backendStatus = document.getElementById('backendStatus');

// Check backend connection on load
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (response.ok) {
            backendStatus.textContent = 'Connected ✅';
            backendStatus.style.color = '#4CAF50';
        } else {
            backendStatus.textContent = 'Error ❌';
            backendStatus.style.color = '#ff6b6b';
        }
    } catch (error) {
        backendStatus.textContent = 'Offline ❌';
        backendStatus.style.color = '#ff6b6b';
        console.error('Backend connection failed:', error);
    }
}

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
    
    const passwordError = validatePassword(password, confirmPassword);
    if (passwordError) {
        showError(passwordError);
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Account created successfully! Redirecting to login...');
            registerForm.reset();
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showError('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Server error! Please check backend connection.');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', checkBackendConnection);