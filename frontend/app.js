const API_BASE = 'http://localhost:8000';

let token = localStorage.getItem('token') || null;
let currentUser = null;
try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) currentUser = JSON.parse(savedUser);
} catch (e) {
    localStorage.removeItem('user');
}

const authView = document.getElementById('auth-view');
const otpView = document.getElementById('otp-view');
const farmerView = document.getElementById('farmer-view');
const ngoView = document.getElementById('ngo-view');
const userNav = document.getElementById('user-nav');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userRoleLabel = document.getElementById('user-role-label');
const logoutBtn = document.getElementById('logout-btn');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const nameGroup = document.getElementById('name-group');
const roleGroup = document.getElementById('role-group');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authToggleText = document.getElementById('auth-toggle-text');
const authToggleLink = document.getElementById('auth-toggle-link');
const regNameInput = document.getElementById('reg-name');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const uploadProduceForm = document.getElementById('upload-produce-form');
const produceImageFile = document.getElementById('produce-image-file');
const produceImageUrl = document.getElementById('produce-image-url');
const imageUploadPreview = document.getElementById('image-upload-preview');

const otpForm = document.getElementById('otp-form');
const otpEmailInput = document.getElementById('otp-email');
const otpCodeInput = document.getElementById('otp-code');
const otpBackLink = document.getElementById('otp-back-link');

const tabFarmerListings = document.getElementById('tab-farmer-listings');
const tabFarmerRequests = document.getElementById('tab-farmer-requests');
const tabFarmerHistory = document.getElementById('tab-farmer-history');
const farmerListingsTabContent = document.getElementById('farmer-listings-tab-content');
const farmerRequestsTabContent = document.getElementById('farmer-requests-tab-content');
const farmerHistoryTabContent = document.getElementById('farmer-history-tab-content');

const tabNgoBrowse = document.getElementById('tab-ngo-browse');
const tabNgoRequests = document.getElementById('tab-ngo-requests');
const tabNgoHistory = document.getElementById('tab-ngo-history');
const ngoBrowseTabContent = document.getElementById('ngo-browse-tab-content');
const ngoRequestsTabContent = document.getElementById('ngo-requests-tab-content');
const ngoHistoryTabContent = document.getElementById('ngo-history-tab-content');

const applyFiltersBtn = document.getElementById('apply-filters-btn');

let isRegisterMode = false;

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4000);
}

function showView(view) {
    authView.classList.remove('active');
    otpView.classList.remove('active');
    farmerView.classList.remove('active');
    ngoView.classList.remove('active');

    if (view === 'auth') {
        authView.classList.add('active');
        userNav.style.display = 'none';
    } else if (view === 'otp') {
        otpView.classList.add('active');
        userNav.style.display = 'none';
    } else if (view === 'Farmer') {
        farmerView.classList.add('active');
        userNav.style.display = 'flex';
        updateHeader();
        loadFarmerDashboard();
    } else if (view === 'NGO') {
        ngoView.classList.add('active');
        userNav.style.display = 'flex';
        updateHeader();
        loadNgoDashboard();
    }
}

function updateHeader() {
    if (currentUser) {
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        userName.textContent = currentUser.name;
        userRoleLabel.textContent = currentUser.role;
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'info');
    showView('auth');
}

authToggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;

    if (isRegisterMode) {
        authTitle.textContent = 'Create an Account';
        authSubtitle.textContent = 'Register to join the surplus distribution network';
        nameGroup.style.display = 'block';
        roleGroup.style.display = 'block';
        authSubmitBtn.textContent = 'Register';
        authToggleText.textContent = 'Already have an account?';
        authToggleLink.textContent = 'Login here';
        regNameInput.required = true;
    } else {
        authTitle.textContent = 'Welcome to FarmShare';
        authSubtitle.textContent = 'Login to connect surplus produce with those in need';
        nameGroup.style.display = 'none';
        roleGroup.style.display = 'none';
        authSubmitBtn.textContent = 'Login';
        authToggleText.textContent = "Don't have an account?";
        authToggleLink.textContent = 'Register here';
        regNameInput.required = false;
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    try {
        if (isRegisterMode) {
            const name = regNameInput.value;
            const role = document.querySelector('input[name="user-role"]:checked').value;
            
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Registration failed');
            }

            const data = await response.json();
            otpEmailInput.value = email;
            otpCodeInput.value = '';
            showToast(data.message || 'OTP verification code sent');
            showView('otp');
        } else {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const err = await response.json();
                if (response.status === 403 && err.detail && err.detail.includes('verify your OTP')) {
                    otpEmailInput.value = email;
                    otpCodeInput.value = '';
                    showToast(err.detail, 'warning');
                    showView('otp');
                    return;
                }
                throw new Error(err.detail || 'Login failed');
            }

            const data = await response.json();
            token = data.access_token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showToast('Welcome back, ' + currentUser.name);
            showView(currentUser.role);
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
});

otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = otpEmailInput.value;
    const otp_code = otpCodeInput.value;

    try {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp_code })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'OTP verification failed');
        }

        const data = await response.json();
        token = data.access_token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        showToast('Verification successful! Welcome, ' + currentUser.name);
        showView(currentUser.role);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

otpBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView('auth');
});

logoutBtn.addEventListener('click', handleLogout);

produceImageFile.addEventListener('change', async () => {
    if (!produceImageFile.files || produceImageFile.files.length === 0) return;
    
    const file = produceImageFile.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to upload image');
        }

        const data = await response.json();
        produceImageUrl.value = data.url;
        imageUploadPreview.src = data.url;
        imageUploadPreview.style.display = 'block';
        showToast('Image uploaded successfully');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

uploadProduceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        produce_name: document.getElementById('produce-name').value,
        quantity: parseFloat(document.getElementById('produce-quantity').value),
        harvest_date: document.getElementById('produce-date').value,
        location: document.getElementById('produce-location').value,
        image_url: produceImageUrl.value || null
    };

    try {
        const response = await fetch(`${API_BASE}/produce`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to create listing');
        }

        showToast('Produce listing shared successfully');
        uploadProduceForm.reset();
        imageUploadPreview.style.display = 'none';
        loadFarmerListings();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

tabFarmerListings.addEventListener('click', () => {
    tabFarmerListings.classList.add('active');
    tabFarmerRequests.classList.remove('active');
    tabFarmerHistory.classList.remove('active');
    farmerListingsTabContent.style.display = 'block';
    farmerRequestsTabContent.style.display = 'none';
    farmerHistoryTabContent.style.display = 'none';
    loadFarmerListings();
});

tabFarmerRequests.addEventListener('click', () => {
    tabFarmerListings.classList.remove('active');
    tabFarmerRequests.classList.add('active');
    tabFarmerHistory.classList.remove('active');
    farmerListingsTabContent.style.display = 'none';
    farmerRequestsTabContent.style.display = 'block';
    farmerHistoryTabContent.style.display = 'none';
    loadFarmerRequests();
});

tabFarmerHistory.addEventListener('click', () => {
    tabFarmerListings.classList.remove('active');
    tabFarmerRequests.classList.remove('active');
    tabFarmerHistory.classList.add('active');
    farmerListingsTabContent.style.display = 'none';
    farmerRequestsTabContent.style.display = 'none';
    farmerHistoryTabContent.style.display = 'block';
    loadFarmerHistory();
});

tabNgoBrowse.addEventListener('click', () => {
    tabNgoBrowse.classList.add('active');
    tabNgoRequests.classList.remove('active');
    tabNgoHistory.classList.remove('active');
    ngoBrowseTabContent.style.display = 'block';
    ngoRequestsTabContent.style.display = 'none';
    ngoHistoryTabContent.style.display = 'none';
    loadNgoBrowse();
});

tabNgoRequests.addEventListener('click', () => {
    tabNgoBrowse.classList.remove('active');
    tabNgoRequests.classList.add('active');
    tabNgoHistory.classList.remove('active');
    ngoBrowseTabContent.style.display = 'none';
    ngoRequestsTabContent.style.display = 'block';
    ngoHistoryTabContent.style.display = 'none';
    loadNgoRequests();
});

tabNgoHistory.addEventListener('click', () => {
    tabNgoBrowse.classList.remove('active');
    tabNgoRequests.classList.remove('active');
    tabNgoHistory.classList.add('active');
    ngoBrowseTabContent.style.display = 'none';
    ngoRequestsTabContent.style.display = 'none';
    ngoHistoryTabContent.style.display = 'block';
    loadNgoHistory();
});

applyFiltersBtn.addEventListener('click', () => {
    loadNgoBrowse();
});

async function loadFarmerDashboard() {
    loadFarmerListings();
    loadFarmerRequests();
}

async function loadNgoDashboard() {
    loadNgoBrowse();
    loadNgoRequests();
}

async function loadFarmerListings() {
    const listEl = document.getElementById('farmer-produce-list');
    try {
        const response = await fetch(`${API_BASE}/produce/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load listings');

        const all = await response.json();
        const items = all.filter(i => i.status !== 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No active listings. Delivered items appear in History.</div>';
            return;
        }

        listEl.innerHTML = items.map(item => `
            <div class="produce-card">
                <div class="produce-img-box">
                    <img class="produce-img" src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}" alt="${item.produce_name}">
                    <span class="produce-status-badge badge-${item.status}">${item.status.replace('_', ' ')}</span>
                </div>
                <div class="produce-info">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Quantity:</span>
                        <span>${item.quantity} kg</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Harvest:</span>
                        <span>${item.harvest_date}</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Location:</span>
                        <span>${item.location}</span>
                    </div>
                </div>
                <div class="produce-footer">
                    <button class="btn btn-danger btn-sm" onclick="deleteProduce('${item.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function deleteProduce(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
        const response = await fetch(`${API_BASE}/produce/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete produce');

        showToast('Produce listing deleted');
        loadFarmerListings();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.deleteProduce = deleteProduce;

async function loadFarmerRequests() {
    const listEl = document.getElementById('farmer-requests-list');
    try {
        const response = await fetch(`${API_BASE}/requests/incoming`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load incoming requests');

        const items = await response.json();
        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No incoming requests yet.</div>';
            return;
        }

        listEl.innerHTML = items.map(item => `
            <div class="request-card">
                <div class="request-header">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <span class="produce-status-badge badge-${item.status}">${item.status}</span>
                </div>
                <div class="request-detail-grid">
                    <div><strong>NGO:</strong> ${item.ngo_name || 'Anonymous NGO'}</div>
                    <div><strong>Quantity:</strong> ${item.quantity} kg</div>
                    <div><strong>Location:</strong> ${item.location}</div>
                    <div><strong>Requested:</strong> ${new Date(item.requested_at).toLocaleDateString()}</div>
                </div>
                ${item.status === 'pending' ? `
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button class="btn btn-primary" onclick="updateRequestStatus('${item.id}', 'accept')">Accept</button>
                        <button class="btn btn-danger" onclick="updateRequestStatus('${item.id}', 'reject')">Reject</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function updateRequestStatus(id, action) {
    try {
        const response = await fetch(`${API_BASE}/requests/${id}/${action}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update request');
        }

        showToast(`Request ${action}ed successfully`);
        loadFarmerRequests();
        loadFarmerListings();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.updateRequestStatus = updateRequestStatus;

async function loadNgoBrowse() {
    const listEl = document.getElementById('ngo-produce-list');
    
    const filterName = document.getElementById('filter-name').value;
    const filterLocation = document.getElementById('filter-location').value;
    const filterStatus = document.getElementById('filter-status').value;

    const params = new URLSearchParams();
    if (filterName) params.append('produce_name', filterName);
    if (filterLocation) params.append('location', filterLocation);
    if (filterStatus) params.append('status', filterStatus);

    try {
        const response = await fetch(`${API_BASE}/produce?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to search produce');

        const all = await response.json();
        const items = all.filter(i => i.status !== 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No produce matches your criteria.</div>';
            return;
        }

        listEl.innerHTML = items.map(item => `
            <div class="produce-card">
                <div class="produce-img-box">
                    <img class="produce-img" src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}" alt="${item.produce_name}">
                    <span class="produce-status-badge badge-${item.status}">${item.status.replace('_', ' ')}</span>
                </div>
                <div class="produce-info">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Quantity:</span>
                        <span>${item.quantity} kg</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Harvest:</span>
                        <span>${item.harvest_date}</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Farmer:</span>
                        <span>${item.farmer_name || 'Anonymous Farmer'}</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Location:</span>
                        <span>${item.location}</span>
                    </div>
                </div>
                <div class="produce-footer">
                    ${item.status === 'available' ? `
                        <button class="btn btn-primary" onclick="requestPickup('${item.id}')">Request Pickup</button>
                    ` : `
                        <button class="btn btn-secondary" disabled>${item.status.replace('_', ' ')}</button>
                    `}
                </div>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function requestPickup(produceId) {
    try {
        const response = await fetch(`${API_BASE}/requests/${produceId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to request pickup');
        }

        showToast('Pickup request sent successfully');
        loadNgoBrowse();
        loadNgoRequests();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.requestPickup = requestPickup;

async function loadNgoRequests() {
    const listEl = document.getElementById('ngo-requests-list');
    try {
        const response = await fetch(`${API_BASE}/requests/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load my requests');

        const all = await response.json();
        const items = all.filter(i => i.status !== 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No active requests. Delivered items appear in History.</div>';
            return;
        }

        listEl.innerHTML = items.map(item => `
            <div class="request-card">
                <div class="request-header">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <span class="produce-status-badge badge-${item.status}">${item.status}</span>
                </div>
                <div class="request-detail-grid">
                    <div><strong>Farmer:</strong> ${item.farmer_name || 'Anonymous Farmer'}</div>
                    <div><strong>Quantity:</strong> ${item.quantity} kg</div>
                    <div><strong>Location:</strong> ${item.location}</div>
                    <div><strong>Requested:</strong> ${new Date(item.requested_at).toLocaleDateString()}</div>
                </div>
                ${item.status === 'accepted' ? `
                    <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                        <button class="btn btn-primary" onclick="markAsDelivered('${item.id}')">Mark Delivered</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function markAsDelivered(requestId) {
    try {
        const response = await fetch(`${API_BASE}/requests/${requestId}/delivered`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update delivery status');
        }

        showToast('Pickup completed and marked as delivered');
        loadNgoRequests();
        loadNgoBrowse();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.markAsDelivered = markAsDelivered;

async function loadFarmerHistory() {
    const listEl = document.getElementById('farmer-history-list');
    try {
        const response = await fetch(`${API_BASE}/produce/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load history');

        const all = await response.json();
        const items = all.filter(i => i.status === 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No delivered produce yet. Completed donations will appear here.</div>';
            return;
        }

        listEl.innerHTML = items.map(item => `
            <div class="produce-card" style="opacity: 0.85;">
                <div class="produce-img-box">
                    <img class="produce-img" src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}" alt="${item.produce_name}">
                    <span class="produce-status-badge badge-delivered">✓ Delivered</span>
                </div>
                <div class="produce-info">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Quantity:</span>
                        <span>${item.quantity} kg donated</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Harvest:</span>
                        <span>${item.harvest_date}</span>
                    </div>
                    <div class="produce-meta">
                        <span class="produce-meta-label">Location:</span>
                        <span>${item.location}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function loadNgoHistory() {
    const listEl = document.getElementById('ngo-history-list');
    try {
        const response = await fetch(`${API_BASE}/requests/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load history');

        const all = await response.json();
        const items = all.filter(i => i.status === 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No deliveries completed yet. They will appear here once marked as delivered.</div>';
            return;
        }

        listEl.innerHTML = items.map(item => `
            <div class="request-card" style="opacity: 0.85;">
                <div class="request-header">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <span class="produce-status-badge badge-delivered">✓ Delivered</span>
                </div>
                <div class="request-detail-grid">
                    <div><strong>Farmer:</strong> ${item.farmer_name || 'Anonymous Farmer'}</div>
                    <div><strong>Quantity:</strong> ${item.quantity} kg</div>
                    <div><strong>Location:</strong> ${item.location}</div>
                    <div><strong>Delivered:</strong> ${new Date(item.updated_at).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

if (token && currentUser) {
    showView(currentUser.role);
} else {
    showView('auth');
}
