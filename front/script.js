var selectedRow = null;

// Backend URL
const API_BASE_URL = 'https://projekt-crud-enestalha-kayhan.onrender.com';
const AUTH_URL = 'https://authpage67829.netlify.app';

// DOM loaded event
document.addEventListener('DOMContentLoaded', function() {
    console.log('StockTrack loaded - Checking authentication...');
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

// Authentication check
async function checkAuthAndLoadProducts() {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('auth_email');
    
    console.log('Auth check:', { 
        hasToken: !!token, 
        hasEmail: !!userEmail,
        currentUrl: window.location.href 
    });
    
    // If no token, redirect to login
    if (!token || !userEmail) {
        console.log('No authentication found, redirecting to login');
        window.location.href = AUTH_URL;
        return;
    }
    
    // If token exists, load products directly
    try {
        console.log('Token found, loading products...');
        setupUserHeader(userEmail);
        await loadProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        window.location.href = AUTH_URL;
    }
}

// Setup user header in top-left position
function setupUserHeader(email) {
    console.log('Setting up user header for:', email);
    
    const header = document.createElement('div');
    header.style.cssText = `
        background: #2c3e50;
        color: white;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-radius: 8px;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="background: #4CAF50; width: 8px; height: 8px; border-radius: 50%;"></div>
            <div>
                <strong style="color: white; font-size: 14px;">Welcome, ${email}</strong>
                <div style="font-size: 11px; color: #bdc3c7; margin-top: 2px;">StockTrack Dashboard</div>
            </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <button id="profileBtn" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">Profile</button>
            <button id="logoutBtn" style="
                background: #e74c3c;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">Logout</button>
        </div>
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
    
    // Logout event listener
    document.getElementById('logoutBtn').addEventListener('click', function() {
        console.log('Logout clicked');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_email');
        window.location.href = AUTH_URL;
    });
    
    // Profile event listener
    document.getElementById('profileBtn').addEventListener('click', async function() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (response.ok) {
                const profile = await response.json();
                alert(`Profile Information:\n\nEmail: ${profile.email}\nRole: ${profile.role}\nMember since: ${new Date(profile.created_at).toLocaleDateString()}`);
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
        }
    });
}

// Load products
async function loadProducts() {
    try {
        showMessage('Loading your products...', 'loading');
        
        const token = localStorage.getItem('token');
        
        console.log('Fetching products from:', `${API_BASE_URL}/api/products`);
        
        const response = await fetch(`${API_BASE_URL}/api/products`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('Products response status:', response.status);
        
        if (response.status === 401) {
            console.log('Token invalid, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('auth_email');
            window.location.href = AUTH_URL;
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products loaded successfully:', products.length, 'products');
        
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
        console.log('Products displayed successfully');
        
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Failed to load products. Please check your connection.', 'error');
    }
}

// Other functions remain the same...
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
        
        const token = localStorage.getItem('token');
        
        if (selectedRow === null) {
            // Add new product
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to add product');
            }
            
            showMessage('Product added successfully!', 'success');
        } else {
            // Update product
            const productId = selectedRow.getAttribute('data-id');
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
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

async function onDelete(td) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    const row = td.closest('tr');
    const productId = row.getAttribute('data-id');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
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

// Page loaded message
console.log('StockTrack application initialized');