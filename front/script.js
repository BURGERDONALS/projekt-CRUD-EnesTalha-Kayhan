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

// URL'den parametreleri al
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    
    console.log('URL Parameters:', { token: token ? 'exists' : 'missing', email: email || 'missing' });
    
    return { token, email };
}

// Authentication kontrolü - URL parametrelerini de kontrol et
async function checkAuthAndLoadProducts() {
    // Önce URL parametrelerini kontrol et
    const urlParams = getUrlParams();
    const urlToken = urlParams.token;
    const urlEmail = urlParams.email;
    
    // Sonra localStorage'ı kontrol et
    const localToken = localStorage.getItem('token');
    const localEmail = localStorage.getItem('auth_email');
    
    console.log('StockTrack Auth check:', { 
        urlToken: urlToken ? 'exists' : 'missing',
        urlEmail: urlEmail || 'missing',
        localToken: localToken ? 'exists' : 'missing',
        localEmail: localEmail || 'missing'
    });
    
    let finalToken = localToken || urlToken;
    let finalEmail = localEmail || urlEmail;
    
    // Eğer URL'den token gelmişse, localStorage'a kaydet
    if (urlToken && urlEmail) {
        console.log('Saving URL parameters to localStorage...');
        localStorage.setItem('token', urlToken);
        localStorage.setItem('auth_email', urlEmail);
        localStorage.setItem('user', JSON.stringify({ email: urlEmail }));
        
        // URL'den parametreleri temizle
        window.history.replaceState({}, document.title, window.location.pathname);
        
        finalToken = urlToken;
        finalEmail = urlEmail;
    }
    
    // Eğer hala token veya email yoksa login'e gönder
    if (!finalToken || !finalEmail) {
        console.log('No authentication found, redirecting to login');
        window.location.href = AUTH_URL;
        return;
    }
    
    // Token ve email varsa, doğrudan ürünleri yükle
    try {
        console.log('Authentication found, setting up interface for:', finalEmail);
        setupUserHeader(finalEmail);
        await loadProducts();
    } catch (error) {
        console.error('Error in StockTrack:', error);
        showMessage('Error loading application', 'error');
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
                transition: background 0.3s ease;
            ">Profile</button>
            <button id="logoutBtn" style="
                background: #e74c3c;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s ease;
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
    
    // Add hover effects
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    profileBtn.addEventListener('mouseenter', () => {
        profileBtn.style.background = '#2980b9';
    });
    profileBtn.addEventListener('mouseleave', () => {
        profileBtn.style.background = '#3498db';
    });
    
    logoutBtn.addEventListener('mouseenter', () => {
        logoutBtn.style.background = '#c0392b';
    });
    logoutBtn.addEventListener('mouseleave', () => {
        logoutBtn.style.background = '#e74c3c';
    });
    
    // Logout event listener
    logoutBtn.addEventListener('click', function() {
        console.log('Logout clicked');
        if (confirm('Are you sure you want to logout?')) {
            // Tüm storage'ı temizle
            localStorage.clear();
            console.log('LocalStorage cleared, redirecting to login');
            window.location.href = AUTH_URL;
        }
    });
    
    // Profile event listener
    profileBtn.addEventListener('click', async function() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login again');
            window.location.href = AUTH_URL;
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (response.ok) {
                const profile = await response.json();
                alert(`Profile Information:\n\nEmail: ${profile.email}\nRole: ${profile.role}\nMember since: ${new Date(profile.created_at).toLocaleDateString()}`);
            } else {
                alert('Error fetching profile information');
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            alert('Error fetching profile information');
        }
    });
}

// Load products
async function loadProducts() {
    try {
        showMessage('Loading your products...', 'loading');
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('No token found');
        }
        
        console.log('Fetching products from:', `${API_BASE_URL}/api/products`);
        
        const response = await fetch(`${API_BASE_URL}/api/products`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('Products response status:', response.status);
        
        // Eğer 401 hatası alırsak, token geçersiz demektir
        if (response.status === 401) {
            console.log('Token invalid, clearing storage and redirecting to login');
            localStorage.clear();
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

// Diğer fonksiyonlar aynı kalacak...
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

// Sayfa yüklendiğinde console'a mesaj yaz
console.log('StockTrack application initialized');