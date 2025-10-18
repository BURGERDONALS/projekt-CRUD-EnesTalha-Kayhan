var selectedRow = null
const API_URL = 'http://localhost:5000/api/products';

document.addEventListener('DOMContentLoaded', loadProducts);

async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        const table = document.getElementById("storeList").getElementsByTagName('tbody')[0];
        table.innerHTML = '';
        
        products.forEach(product => {
            const newRow = table.insertRow(table.length);
            newRow.setAttribute('data-id', product._id);
            
            cell1 = newRow.insertCell(0);
            cell1.innerHTML = product.productCode;
            cell2 = newRow.insertCell(1);
            cell2.innerHTML = product.product;
            cell3 = newRow.insertCell(2);
            cell3.innerHTML = product.qty;
            cell4 = newRow.insertCell(3);
            cell4.innerHTML = product.perPrice;
            cell5 = newRow.insertCell(4);
            cell5.innerHTML = `<button onClick="onEdit(this)">Edit</button> <button onClick="onDelete(this)">Delete</button>`;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function onFormSubmit(e) {
    event.preventDefault();
    var formData = readFormData();
    
    try {
        if (selectedRow == null){
            await insertNewRecord(formData);
        } else {
            await updateRecord(formData);
        }
        resetForm();
        await loadProducts();
    } catch (error) {
        console.error('Error during operation:', error);
        alert('Operation failed');
    }
}

function readFormData() {
    var formData = {};
    formData["productCode"] = document.getElementById("productCode").value;
    formData["product"] = document.getElementById("product").value;
    formData["qty"] = document.getElementById("qty").value;
    formData["perPrice"] = document.getElementById("perPrice").value;
    return formData;
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
        throw new Error('Failed to add product');
    }
}

function onEdit(td) {
    selectedRow = td.parentElement.parentElement;
    document.getElementById("productCode").value = selectedRow.cells[0].innerHTML;
    document.getElementById("product").value = selectedRow.cells[1].innerHTML;
    document.getElementById("qty").value = selectedRow.cells[2].innerHTML;
    document.getElementById("perPrice").value = selectedRow.cells[3].innerHTML;
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
        throw new Error('Failed to update product');
    }
}

async function onDelete(td) {
    if (confirm('Do you want to delete this record?')) {
        const row = td.parentElement.parentElement;
        const productId = row.getAttribute('data-id');
        
        try {
            const response = await fetch(`${API_URL}/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                row.remove();
            } else {
                throw new Error('Delete operation failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete product');
        }
        
        resetForm();
    }
}

function resetForm() {
    document.getElementById("productCode").value = '';
    document.getElementById("product").value = '';
    document.getElementById("qty").value = '';
    document.getElementById("perPrice").value = '';
    selectedRow = null;
}