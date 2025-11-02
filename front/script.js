var selectedRow = null;

// Environment detection
const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return 'https://your-stocktrack-backend.onrender.com/api';
};

const API_BASE_URL = getApiUrl();
const AUTH_URL = 'https://authpage67829.netlify.app';

// Check if we're in a redirect loop
let redirectCheck = localStorage.getItem('redirect_check');
if (redirectCheck === 'true') {
    localStorage.removeItem('redirect_check');
} else {
    localStorage.setItem('redirect_check', 'true');
}

// DOM loaded event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const form = document.getElementById('productForm');
    const resetBtn = document.getElementById('resetBtn');
    
    if (!form) {
        console.error('Form element not found!');
        return;
    }
    
    form.addEventListener('submit', onFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    
    checkAuthAndLoadProducts();
}

// Auth kontrolü - Loop önleyici
async function checkAuthAndLoadProducts() {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('auth_email');
    
    console.log('Auth check:', { token: !!token, userEmail: !!userEmail });
    
    if (!token || !userEmail) {
        console.log('No auth found, redirecting to login');
        // Redirect loop'u önlemek için kontrol
        if (!window.location.href.includes('authpage67829')) {
            window.location.href = AUTH_URL;
        }
        return;
    }
    
    // Token'ı validate et
    try {
        const response = await fetch(`${API_BASE_URL}/user-info`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        
        const userInfo = await response.json();
        console.log('User info:', userInfo);
        
        setupUserHeader(userInfo.email);
        await loadProducts();
        
    } catch (error) {
        console.error('Token validation failed:', error);
        // Geçersiz token, temizle ve login'e yönlendir
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_email');
        
        if (!window.location.href.includes('authpage67829')) {
            window.location.href = AUTH_URL;
        }
    }
}

// Header'a kullanıcı bilgilerini ekle
function setupUserHeader(email) {
    const header = document.createElement('div');
    header.style.cssText = `
        background: #2c3e50;
        color: white;
        padding: 15px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-radius: 8px;
    `;
    
    header.innerHTML = `
        <div>
            <strong style="color: #4CAF50;">Welcome, ${email}</strong>
            <div style="font-size: 12px; color: #bdc3c7;">You are logged in successfully</div>
        </div>
        <button id="logoutBtn" style="
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        ">Logout</button>
    `;
    
    const container = document.querySelector('.container');
    const existingHeader = document.getElementById('userHeader');
    if (existingHeader) {
        existingHeader.innerHTML = header.innerHTML;
    } else {
        header.id = 'userHeader';
        const firstChild = container.firstChild;
        container.insertBefore(header, firstChild);
    }
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Logout fonksiyonu - Loop önleyici
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('redirect_check');
    
    // Doğrudan login sayfasına yönlendir
    window.location.href = AUTH_URL;
}

// Load products with authentication
async function loadProducts() {
    try {
        showMessage('Loading products...', 'loading');
        
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/products`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.status === 401) {
            console.log('Unauthorized, logging out');
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        
        const tableBody = document.querySelector("#storeList tbody");
        if (!tableBody) {
            console.error('Table body not found!');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6c757d;">No products found. Add your first product above!</td></tr>';
            hideMessage();
            return;
        }
        
        products.forEach(product => {
            const newRow = tableBody.insertRow();
            newRow.setAttribute('data-id', product.id);
            
            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            const cell4 = newRow.insertCell(3);
            const cell5 = newRow.insertCell(4);
            
            cell1.textContent = product.productcode || product.productCode || '';
            cell2.textContent = product.product || '';
            cell3.textContent = product.qty || '';
            cell4.textContent = `$${parseFloat(product.perprice || product.perPrice || 0).toFixed(2)}`;
            cell5.innerHTML = `<button onclick="onEdit(this)">Edit</button> <button onclick="onDelete(this)">Delete</button>`;
            
            cell1.setAttribute('data-label', 'Product Code');
            cell2.setAttribute('data-label', 'Product Name');
            cell3.setAttribute('data-label', 'Quantity');
            cell4.setAttribute('data-label', 'Price');
            cell5.setAttribute('data-label', 'Actions');
        });
        
        hideMessage();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Failed to load products. Please check your connection.', 'error');
    }
}

async function onFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        const formData = readFormData();
        
        if (!validateFormData(formData)) {
            showMessage('Please fill all fields correctly.', 'error');
            return;
        }
        
        if (selectedRow === null) {
            await insertNewRecord(formData);
            showMessage('Product added successfully!', 'success');
        } else {
            await updateRecord(formData);
            showMessage('Product updated successfully!', 'success');
        }
        
        resetForm();
        await loadProducts();
        
    } catch (error) {
        console.error('Error during operation:', error);
        showMessage('Operation failed: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function readFormData() {
    return {
        productCode: document.getElementById("productCode").value.trim(),
        product: document.getElementById("product").value.trim(),
        qty: document.getElementById("qty").value,
        perPrice: document.getElementById("perPrice").value
    };
}

function validateFormData(data) {
    if (!data.productCode || !data.product || !data.qty || !data.perPrice) {
        return false;
    }
    
    if (data.qty < 1 || data.perPrice < 0.01) {
        return false;
    }
    
    return true;
}

async function insertNewRecord(data) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add product');
    }
    
    return await response.json();
}

function onEdit(td) {
    selectedRow = td.closest('tr');
    const cells = selectedRow.cells;
    
    document.getElementById("productCode").value = cells[0].textContent;
    document.getElementById("product").value = cells[1].textContent;
    document.getElementById("qty").value = cells[2].textContent;
    document.getElementById("perPrice").value = cells[3].textContent.replace('$', '');
    
    document.getElementById("submitBtn").textContent = "Update";
    
    document.querySelector('.form-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

async function updateRecord(formData) {
    const productId = selectedRow.getAttribute('data-id');
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update product');
    }
    
    return await response.json();
}

async function onDelete(td) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    const row = td.closest('tr');
    const productId = row.getAttribute('data-id');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (!response.ok) {
            throw new Error('Delete operation failed');
        }
        
        row.remove();
        showMessage('Product deleted successfully!', 'success');
        
        const tableBody = document.querySelector("#storeList tbody");
        if (tableBody.rows.length === 0) {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showMessage('Failed to delete product. Please try again.', 'error');
    }
}

function resetForm() {
    document.getElementById("productCode").value = '';
    document.getElementById("product").value = '';
    document.getElementById("qty").value = '';
    document.getElementById("perPrice").value = '';
    
    document.getElementById("submitBtn").textContent = "Submit";
    selectedRow = null;
}

function showMessage(text, type) {
    hideMessage();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.id = 'app-message';
    
    const container = document.querySelector('.container');
    const firstChild = container.firstChild;
    container.insertBefore(messageDiv, firstChild);
    
    if (type !== 'loading') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

function hideMessage() {
    const message = document.getElementById('app-message');
    if (message) {
        message.remove();
    }
}

window.onEdit = onEdit;
window.onDelete = onDelete;