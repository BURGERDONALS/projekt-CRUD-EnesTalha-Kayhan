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
    const authEmail = localStorage.getItem('auth_email');
    
    console.log('Auth status check:', { 
        token: token ? 'exists' : 'missing',
        user: user ? 'exists' : 'missing', 
        authEmail: authEmail || 'missing'
    });
    
    if (token && user && authEmail) {
        try {
            const userData = JSON.parse(user);
            showUserInfo(userData);
            showSuccess('You are already logged in. Redirecting to StockTrack...');
            
            // Hızlı redirect - 1.5 saniye
            setTimeout(() => {
                console.log('Auto-redirecting to StockTrack...');
                redirectToStockTrack(token, authEmail);
            }, 1500);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.clear();
        }
    } else {
        console.log('Not logged in, showing login form');
    }
}

// Redirect to StockTrack with token in URL
function redirectToStockTrack(token, email) {
    // Token'ı URL parameter olarak gönder
    const redirectUrl = `${STOCKTRACK_URL}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    console.log('Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
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
        console.log('Attempting login for:', email);
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
            // Tüm gerekli dataları kaydet
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('auth_email', data.user.email);
            
            console.log('Login successful, data saved to localStorage');
            
            showSuccess('Login successful! Redirecting to StockTrack...');
            showUserInfo(data.user);
            
            // Hızlı redirect - 1.5 saniye
            setTimeout(() => {
                console.log('Redirecting to StockTrack...');
                redirectToStockTrack(data.token, data.user.email);
            }, 1500);
            
        } else {
            showError('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
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
    console.log('Login page initialized');
    checkBackendConnection();
    checkAuthStatus();
});