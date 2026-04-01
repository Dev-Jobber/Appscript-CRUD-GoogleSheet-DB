// User Management App JavaScript

// Configuration
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxet6B-9dhHhHX8gb4PqiyT_ASJARFh0uwM1gQcOZxLaKUQrSQWuF84uEIIf2EYXac/exec',
    SHEET_NAME: 'users'
};

// State Management
let state = {
    editingUserId: null,
    isLoading: false,
    users: []
};

// DOM Elements
const elements = {
    userForm: document.getElementById('userForm'),
    formTitle: document.getElementById('formTitle'),
    userId: document.getElementById('userId'),
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    role: document.getElementById('role'),
    status: document.getElementById('status'),
    saveBtn: document.getElementById('saveBtn'),
    updateBtn: document.getElementById('updateBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    messageArea: document.getElementById('messageArea'),
    usersTableBody: document.getElementById('usersTableBody'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    emptyState: document.getElementById('emptyState')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    fetchUsers();
});

// Event Listeners
function initializeEventListeners() {
    elements.userForm.addEventListener('submit', handleFormSubmit);
    elements.saveBtn.addEventListener('click', createUser);
    elements.updateBtn.addEventListener('click', updateUser);
    elements.cancelBtn.addEventListener('click', cancelEdit);
}

// API Functions
async function callAppsScript(action, data = {}) {
    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // Ensure cors mode is explicit
            headers: {
                // Use text/plain to avoid the "OPTIONS" preflight check
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: action,
                data: data
            }),
            redirect: 'follow' // REQUIRED for Google Apps Script redirects
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message || 'API call failed');
        return result;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// CRUD Functions
async function createUser() {
    if (!validateForm()) return;
    setLoading(true);
    try {
        const userData = {
            full_name: elements.fullName.value.trim(),
            email: elements.email.value.trim(),
            phone: elements.phone.value.trim(),
            role: elements.role.value,
            status: elements.status.value
        };

        await callAppsScript('createUser', userData);
        showMessage('User created successfully!', 'success');
        resetForm();
        fetchUsers();
    } catch (error) {
        showMessage('Error creating user: ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function fetchUsers() {
    setLoading(true);
    try {
        const result = await callAppsScript('getUsers');
        state.users = result.data || [];
        renderUsersTable();
    } catch (error) {
        showMessage('Error fetching users: ' + error.message, 'error');
        state.users = [];
        renderUsersTable();
    } finally {
        setLoading(false);
    }
}

async function updateUser() {
    if (!validateForm()) return;
    setLoading(true);
    try {
        const userData = {
            id: elements.userId.value,
            full_name: elements.fullName.value.trim(),
            email: elements.email.value.trim(),
            phone: elements.phone.value.trim(),
            role: elements.role.value,
            status: elements.status.value
        };

        await callAppsScript('updateUser', userData);
        showMessage('User updated successfully!', 'success');
        resetForm();
        fetchUsers();
    } catch (error) {
        showMessage('Error updating user: ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function deleteUser(userId) {
    const confirmed = await showConfirmDialog(
        'Are you sure you want to delete this user?',
        'Delete User',
        'warning'
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
        await callAppsScript('deleteUser', { id: userId });
        showMessage('User deleted successfully!', 'success');
        fetchUsers();
    } catch (error) {
        showMessage('Error deleting user: ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

// UI Functions
function renderUsersTable() {
    const tbody = elements.usersTableBody;
    tbody.innerHTML = '';

    if (state.users.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.loadingSpinner.style.display = 'none';
        return;
    }

    elements.emptyState.style.display = 'none';
    elements.loadingSpinner.style.display = 'none';

    state.users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${user.id}</td>
        <td>${escapeHtml(user.full_name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.phone)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td><span class="status-badge ${user.status}">${user.status}</span></td>
        <td>${formatDate(user.created_at)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-success btn-sm" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">Delete</button>
            </div>
        </td>
    `;
    return row;
}

function editUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) {
        showMessage('User not found!', 'error');
        return;
    }
    state.editingUserId = userId;

    elements.userId.value = user.id;
    elements.fullName.value = user.full_name;
    elements.email.value = user.email;
    elements.phone.value = user.phone;
    elements.role.value = user.role;
    elements.status.value = user.status;

    elements.formTitle.textContent = 'Edit User';
    elements.saveBtn.style.display = 'none';
    elements.updateBtn.style.display = 'inline-block';
    elements.cancelBtn.style.display = 'inline-block';

    elements.userForm.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    elements.userForm.reset();
    elements.userId.value = '';
    state.editingUserId = null;

    elements.formTitle.textContent = 'Add New User';
    elements.saveBtn.style.display = 'inline-block';
    elements.updateBtn.style.display = 'none';
    elements.cancelBtn.style.display = 'none';
}

function showMessage(message, type = 'info') {
    // Use custom dialog instead of browser alert
    showDialog(message, type);

    // Keep visual DOM message active for better UI structure integrity 
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    elements.messageArea.innerHTML = '';
    elements.messageArea.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function setLoading(loading) {
    state.isLoading = loading;
    if (loading) {
        elements.loadingSpinner.style.display = 'block';
        elements.emptyState.style.display = 'none';
        elements.usersTableBody.innerHTML = '';
    } else {
        elements.loadingSpinner.style.display = 'none';
    }

    const buttons = [elements.saveBtn, elements.updateBtn];
    buttons.forEach(btn => {
        if (btn) btn.disabled = loading;
    });
}

// Form Handling
function handleFormSubmit(e) {
    e.preventDefault();
    if (state.editingUserId) {
        updateUser();
    } else {
        createUser();
    }
}

function validateForm() {
    const fullName = elements.fullName.value.trim();
    const email = elements.email.value.trim();
    const phone = elements.phone.value.trim();
    const role = elements.role.value;
    const status = elements.status.value;

    // Clear previous validation errors
    clearValidationErrors();

    let isValid = true;
    let firstErrorField = null;

    if (!fullName) {
        showFieldError(elements.fullName, 'Full name is required');
        isValid = false;
        firstErrorField = firstErrorField || elements.fullName;
    } else if (fullName.length < 2) {
        showFieldError(elements.fullName, 'Full name must be at least 2 characters');
        isValid = false;
        firstErrorField = firstErrorField || elements.fullName;
    }

    if (!email) {
        showFieldError(elements.email, 'Email address is required');
        isValid = false;
        firstErrorField = firstErrorField || elements.email;
    } else if (!isValidEmail(email)) {
        showFieldError(elements.email, 'Please enter a valid email address');
        isValid = false;
        firstErrorField = firstErrorField || elements.email;
    }

    if (!phone) {
        showFieldError(elements.phone, 'Phone number is required');
        isValid = false;
        firstErrorField = firstErrorField || elements.phone;
    } else if (!isValidPhone(phone)) {
        showFieldError(elements.phone, 'Please enter a valid phone number');
        isValid = false;
        firstErrorField = firstErrorField || elements.phone;
    }

    if (!role) {
        showFieldError(elements.role, 'Please select a role');
        isValid = false;
        firstErrorField = firstErrorField || elements.role;
    }

    if (!status) {
        showFieldError(elements.status, 'Please select a status');
        isValid = false;
        firstErrorField = firstErrorField || elements.status;
    }

    if (firstErrorField) {
        firstErrorField.focus();
    }

    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearValidationErrors() {
    // Remove error classes
    document.querySelectorAll('.form-group input, .form-group select').forEach(field => {
        field.classList.remove('error');
    });
    
    // Remove error messages
    document.querySelectorAll('.field-error').forEach(error => {
        error.remove();
    });
}

function isValidPhone(phone) {
    // Basic phone validation - allows digits, spaces, parentheses, hyphens, and plus
    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Custom Dialog Functions
function showDialog(message, type = 'info') {
    // Remove any existing dialog
    const existingDialog = document.querySelector('.custom-dialog-overlay');
    if (existingDialog) {
        existingDialog.remove();
    }

    // Create dialog elements
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = `custom-dialog custom-dialog-${type}`;
    
    const icon = document.createElement('div');
    icon.className = 'dialog-icon';
    icon.innerHTML = getDialogIcon(type);
    
    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.innerHTML = `<h3>${getDialogTitle(type)}</h3><p>${message}</p>`;
    
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    
    const okButton = document.createElement('button');
    okButton.className = 'btn btn-primary';
    okButton.textContent = 'OK';
    okButton.onclick = () => overlay.remove();
    
    actions.appendChild(okButton);
    dialog.appendChild(icon);
    dialog.appendChild(content);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    
    // Add to body and show with animation
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function getDialogIcon(type) {
    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return icons[type] || icons.info;
}

function getDialogTitle(type) {
    const titles = {
        success: 'Success',
        error: 'Error',
        info: 'Information'
    };
    return titles[type] || 'Information';
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text || '';
    }
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
        return dateString;
    }
}

function showConfirmDialog(message, title = 'Confirm', type = 'warning') {
    return new Promise((resolve) => {
        // Remove any existing dialog
        const existingDialog = document.querySelector('.custom-dialog-overlay');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create dialog elements
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = `custom-dialog custom-dialog-${type}`;
        
        const icon = document.createElement('div');
        icon.className = 'dialog-icon';
        icon.innerHTML = getDialogIcon(type === 'warning' ? 'error' : type);
        
        const content = document.createElement('div');
        content.className = 'dialog-content';
        content.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
        
        const actions = document.createElement('div');
        actions.className = 'dialog-actions';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn btn-ghost';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = () => {
            overlay.remove();
            resolve(false);
        };
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'btn btn-primary';
        confirmButton.textContent = type === 'warning' ? 'Delete' : 'Confirm';
        confirmButton.onclick = () => {
            overlay.remove();
            resolve(true);
        };
        
        actions.appendChild(cancelButton);
        actions.appendChild(confirmButton);
        dialog.appendChild(icon);
        dialog.appendChild(content);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        
        // Add to body and show with animation
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

window.editUser = editUser;
window.deleteUser = deleteUser;