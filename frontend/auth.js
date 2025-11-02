// API Configuration
const API_BASE_URL = 'https://projekt-crud-enestalha-kayhan.onrender.com';
const STOCKTRACK_URL = 'https://stocktrack1.netlify.app';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerLink = document.getElementById('registerLink');
const forgotPassword = document.getElementById('forgotPassword');
const logoutLink = document.getElementById('logoutLink');
const usersLink = document.getElementById('usersLink');
const profileLink = document.getElementById('profileLink');
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
        showSuccess('You are already logged in. Click "Continue to StockTrack" to proceed.');
        
        // Redirect butonu ekle
        addContinueButton();
    }
}

// Continue butonu ekle
function addContinueButton() {
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue to StockTrack';
    continueBtn.className = 'btn';
    continueBtn.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    continueBtn.style.marginTop = '10px';
    
    continueBtn.addEventListener('click', () => {
        localStorage.setItem('redirect_check', 'true');
        window.location.href = STOCKTRACK_URL;
    });
    
    const form = document.getElementById('loginForm');
    form.appendChild(continueBtn);
}

// Show user information
function showUserInfo(user) {
    userEmail.textContent = user.email;
    userRole.textContent = user.role;
    userInfo.style.display = 'block';
    logoutLink.style.display = 'inline';
    usersLink.style.display = 'inline';
    profileLink.style.display = 'inline';
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
            
            showSuccess('Login successful! Click "Continue to StockTrack" below.');
            
            // Continue butonu ekle
            addContinueButton();
            
            await testProtectedRoute(data.token);
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

// Logout
logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('redirect_check');
    
    userInfo.style.display = 'none';
    logoutLink.style.display = 'none';
    usersLink.style.display = 'none';
    profileLink.style.display = 'none';
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
    showSuccess('Logged out successfully');
    loginForm.reset();
    
    // Continue butonunu kaldır
    const continueBtn = document.querySelector('.btn[style*="3498db"]');
    if (continueBtn) {
        continueBtn.remove();
    }
});

// Forgot password
forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    showError('Password reset feature coming soon!');
});

// View users (protected route)
usersLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Please login first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('Users:', data);
            alert(`Total users: ${data.length}\n\nUsers:\n${data.map(user => 
                `${user.email} (${user.role}) - ${new Date(user.created_at).toLocaleDateString()}`
            ).join('\n')}`);
        } else {
            showError('Error fetching users: ' + data.error);
        }
    } catch (error) {
        console.error('Users fetch error:', error);
        showError('Error fetching users');
    }
});

// View profile
profileLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Please login first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(`Profile Information:\n\nEmail: ${data.email}\nRole: ${data.role}\nMember since: ${new Date(data.created_at).toLocaleDateString()}`);
        } else {
            showError('Error fetching profile: ' + data.error);
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
        showError('Error fetching profile');
    }
});

// Protected route test
async function testProtectedRoute(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/protected`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('Protected endpoint response:', data);
        } else {
            console.log('Protected endpoint error:', data);
        }
    } catch (error) {
        console.error('Protected route error:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection();
    checkAuthStatus();
});