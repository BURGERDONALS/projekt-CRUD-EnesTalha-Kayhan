// API Configuration
const API_BASE_URL = 'https://projekt-crud-enestalha-kayhan.onrender.com';
const STOCKTRACK_URL = 'https://stocktrack1.netlify.app';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerLink = document.getElementById('registerLink');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const userRole = document.getElementById('userRole');

// Check if user is already logged in
async function checkAuthStatus() {
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
            // Token'ın geçerliliğini backend'de kontrol et
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (response.ok) {
                const userData = JSON.parse(user);
                showUserInfo(userData);
                showSuccess('You are already logged in. Redirecting to StockTrack...');
                
                setTimeout(() => {
                    redirectToStockTrack(token, authEmail);
                }, 1500);
            } else {
                // Token geçersizse storage'ı temizle
                localStorage.clear();
                console.log('Token invalid, cleared storage');
                showError('Session expired. Please login again.');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.clear();
            showError('Authentication check failed. Please login again.');
        }
    } else {
        console.log('Not logged in, showing login form');
        // Storage'da tutarsızlık varsa temizle
        localStorage.clear();
    }
}

// Redirect to StockTrack with token in URL
function redirectToStockTrack(token, email) {
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
    
    // Form alanlarını devre dışı bırak
    document.getElementById('email').disabled = true;
    document.getElementById('password').disabled = true;
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
            
            setTimeout(() => {
                console.log('Redirecting to StockTrack...');
                redirectToStockTrack(data.token, data.user.email);
            }, 1500);
            
        } else {
            showError('Error: ' + (data.error || 'Login failed'));
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Server error! Please check backend connection.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page initialized');
    checkAuthStatus();
});