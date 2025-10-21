var selectedRow = null;
const API_URL = 'https://stock-tracker-linq.onrender.com/api/products';

// DOM loaded event
document.addEventListener('DOMContentLoaded', function() {
    console.log('Stock Tracker App Initialized');
    initializeApp();
});

function initializeApp() {
    // Form event listeners
    const form = document.getElementById('productForm');
    const resetBtn = document.getElementById('resetBtn');
    
    if (!form) {
        console.error('Form element not found!');
        return;
    }
    
    form.addEventListener('submit', onFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    
    // Load initial products
    loadProducts();
}

async function loadProducts() {
    try {
        showMessage('Loading products...', 'loading');
        
        console.log('Fetching products from:', API_URL);
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products loaded:', products);
        
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
            
            cell1.textContent = product.productcode || '';
            cell2.textContent = product.product || '';
            cell3.textContent = product.qty || '';
            cell4.textContent = `$${parseFloat(product.perprice || 0).toFixed(2)}`;
            cell5.innerHTML = `<button onclick="onEdit(this)">Edit</button> <button onclick="onDelete(this)">Delete</button>`;
            
            // Add data labels for mobile
            cell1.setAttribute('data-label', 'Product Code');
            cell2.setAttribute('data-label', 'Product Name');
            cell3.setAttribute('data-label', 'Quantity');
            cell4.setAttribute('data-label', 'Price');
            cell5.setAttribute('data-label', 'Actions');
        });
        
        hideMessage();
        showMessage('Products loaded successfully!', 'success');
        
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
        console.log('Form data:', formData);
        
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
    document.querySelector('.form-section').scrollIntoView({ 
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
        showMessage('Product deleted successfully!', 'success');
        
        // Reload if table is empty
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

// Message functions
function showMessage(text, type) {
    hideMessage();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.id = 'app-message';
    
    const container = document.querySelector('.container');
    const firstChild = container.firstChild;
    container.insertBefore(messageDiv, firstChild);
    
    // Auto remove after 5 seconds for success/error
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

// Global functions for button clicks
window.onEdit = onEdit;
window.onDelete = onDelete;

// Error handling for global functions
window.onload = function() {
    console.log('Window loaded, app ready');
};