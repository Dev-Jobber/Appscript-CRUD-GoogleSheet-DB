// User Management App JavaScript

// Configuration
const CONFIG = {
    // Replace this with your Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxmePy7vU86WDQPDS_ECp9wcV5JEYp3twEHKHcFVHqqifX3q-r0jNk9GvF-XYjMzqQo/exec',
    // Sheet name
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
    // Form submission
    elements.userForm.addEventListener('submit', handleFormSubmit);

    // Button clicks
    elements.saveBtn.addEventListener('click', createUser);
    elements.updateBtn.addEventListener('click', updateUser);
    elements.cancelBtn.addEventListener('click', cancelEdit);
}

// API Functions
async function callAppsScript(action, data = {}) {
    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: action,
                data: data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'error') {
            throw new Error(result.message || 'API call failed');
        }

        return result;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// CRUD Functions
async function createUser() {
    if (!validateForm()) {
        return;
    }

    setLoading(true);

    try {
        const userData = {
            full_name: elements.fullName.value.trim(),
            email: elements.email.value.trim(),
            phone: elements.phone.value.trim(),
            role: elements.role.value,
            status: elements.status.value
        };

        const result = await callAppsScript('createUser', userData);

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
    if (!validateForm()) {
        return;
    }

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

        const result = await callAppsScript('updateUser', userData);

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
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    setLoading(true);

    try {
        const result = await callAppsScript('deleteUser', { id: userId });

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

    // Populate form
    elements.userId.value = user.id;
    elements.fullName.value = user.full_name;
    elements.email.value = user.email;
    elements.phone.value = user.phone;
    elements.role.value = user.role;
    elements.status.value = user.status;

    // Update UI
    elements.formTitle.textContent = 'Edit User';
    elements.saveBtn.style.display = 'none';
    elements.updateBtn.style.display = 'inline-block';
    elements.cancelBtn.style.display = 'inline-block';

    // Scroll to form
    elements.userForm.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    elements.userForm.reset();
    elements.userId.value = '';
    state.editingUserId = null;

    // Update UI
    elements.formTitle.textContent = 'Add New User';
    elements.saveBtn.style.display = 'inline-block';
    elements.updateBtn.style.display = 'none';
    elements.cancelBtn.style.display = 'none';
}

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    elements.messageArea.innerHTML = '';
    elements.messageArea.appendChild(messageDiv);

    // Auto remove after 5 seconds
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
    } else {
        elements.loadingSpinner.style.display = 'none';
    }

    // Disable/enable form buttons
    const buttons = [elements.saveBtn, elements.updateBtn];
    buttons.forEach(btn => {
        if (btn) {
            btn.disabled = loading;
        }
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

    // Required fields
    if (!fullName) {
        showMessage('Full name is required!', 'error');
        elements.fullName.focus();
        return false;
    }

    if (!email) {
        showMessage('Email is required!', 'error');
        elements.email.focus();
        return false;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address!', 'error');
        elements.email.focus();
        return false;
    }

    if (!phone) {
        showMessage('Phone number is required!', 'error');
        elements.phone.focus();
        return false;
    }

    if (!role) {
        showMessage('Please select a role!', 'error');
        elements.role.focus();
        return false;
    }

    if (!status) {
        showMessage('Please select a status!', 'error');
        elements.status.focus();
        return false;
    }

    return true;
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

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

// Make functions globally accessible for onclick handlers
window.editUser = editUser;
window.deleteUser = deleteUser;
