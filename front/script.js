var selectedRow = null;
const API_URL = 'https://stock-tracker-linq.onrender.com/api/products';

// DOM loaded event
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    initializeApp();
});

function initializeApp() {
    // Form event listeners
    const form = document.getElementById('productForm');
    const resetBtn = document.getElementById('resetBtn');
    
    form.addEventListener('submit', onFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    
    // Load initial products
    loadProducts();
}

async function loadProducts() {
    try {
        showLoading('Loading products...');
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        
        const table = document.getElementById("storeList").getElementsByTagName('tbody')[0];
        table.innerHTML = '';
        
        if (products.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6c757d;">No products found. Add your first product above!</td></tr>';
            return;
        }
        
        products.forEach(product => {
            const newRow = table.insertRow();
            newRow.setAttribute('data-id', product.id);
            
            // Make rows responsive
            newRow.innerHTML = `
                <td data-label="Product Code">${escapeHtml(product.productcode)}</td>
                <td data-label="Product Name">${escapeHtml(product.product)}</td>
                <td data-label="Quantity">${escapeHtml(product.qty)}</td>
                <td data-label="Price">$${parseFloat(product.perprice).toFixed(2)}</td>
                <td data-label="Actions">
                    <button onClick="onEdit(this)">Edit</button>
                    <button onClick="onDelete(this)">Delete</button>
                </td>
            `;
        });
        
        hideLoading();
        showSuccess('Products loaded successfully');
        
    } catch (error) {
        console.error('Error loading products:', error);
        hideLoading();
        showError('Failed to load products. Please check your connection.');
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
            showError('Please fill all fields correctly.');
            return;
        }
        
        if (selectedRow === null) {
            await insertNewRecord(formData);
            showSuccess('Product added successfully!');
        } else {
            await updateRecord(formData);
            showSuccess('Product updated successfully!');
        }
        
        resetForm();
        await loadProducts();
        
    } catch (error) {
        console.error('Error during operation:', error);
        showError('Operation failed. Please try again.');
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
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    
    // Scroll to form
    document.querySelector('.form-container').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

async function updateRecord(formData) {
    const productId = selectedRow.getAttribute('data-id');
    
    const response = await fetch(`${API_URL}/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
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
    
    try {
        const response = await fetch(`${API_URL}/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Delete operation failed');
        }
        
        row.remove();
        showSuccess('Product deleted successfully!');
        
        // Reload if table is empty
        const table = document.getElementById("storeList").getElementsByTagName('tbody')[0];
        if (table.rows.length === 0) {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete product. Please try again.');
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

// Utility functions
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showLoading(message = 'Loading...') {
    // Remove existing messages
    hideMessages();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = message;
    loadingDiv.id = 'loading-message';
    
    document.querySelector('.container').insertBefore(loadingDiv, document.querySelector('.table-container'));
}

function hideLoading() {
    const loading = document.getElementById('loading-message');
    if (loading) {
        loading.remove();
    }
}

function showError(message) {
    hideMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.form-container').nextSibling);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    hideMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    document.querySelector('.container').insertBefore(successDiv, document.querySelector('.form-container').nextSibling);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function hideMessages() {
    const messages = document.querySelectorAll('.error, .success, .loading');
    messages.forEach(msg => msg.remove());
}

// Global functions for button clicks
window.onEdit = onEdit;
window.onDelete = onDelete;