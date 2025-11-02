// API Configuration
const API_BASE_URL = 'https://projekt-crud-enestalha-kayhan.onrender.com';
const STOCKTRACK_URL = 'https://stocktrack1.netlify.app';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerLink = document.getElementById('registerLink');
const forgotPassword = document.getElementById('forgotPassword');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const userRole = document.getElementById('userRole');
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

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        showUserInfo(userData);
        showSuccess('You are already logged in. Redirecting to StockTrack...');
        
        // Hızlı redirect - 1 saniye
        setTimeout(() => {
            window.location.href = STOCKTRACK_URL;
        }, 1000);
    }
}

// Show user information
function showUserInfo(user) {
    userEmail.textContent = user.email;
    userRole.textContent = user.role;
    userInfo.style.display = 'block';
    loginBtn.textContent = 'Login Successful';
    loginBtn.disabled = true;
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

// Login process
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    clearMessages();
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('auth_email', data.user.email);
            
            showSuccess('Login successful! Redirecting to StockTrack...');
            showUserInfo(data.user);
            
            // Hızlı redirect - 1 saniye
            setTimeout(() => {
                window.location.href = STOCKTRACK_URL;
            }, 1000);
            
        } else {
            showError('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Server error! Please check backend connection.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

// Forgot password
forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    showError('Password reset feature coming soon!');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection();
    checkAuthStatus();
});