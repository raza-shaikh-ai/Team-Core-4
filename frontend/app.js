const API_BASE = 'http://localhost:8000';
//const API_BASE = 'http://13.234.42.87:8000';


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
const tabFarmerMap = document.getElementById('tab-farmer-map');
const tabFarmerStats = document.getElementById('tab-farmer-stats');
const farmerListingsTabContent = document.getElementById('farmer-listings-tab-content');
const farmerRequestsTabContent = document.getElementById('farmer-requests-tab-content');
const farmerHistoryTabContent = document.getElementById('farmer-history-tab-content');
const farmerMapTabContent = document.getElementById('farmer-map-tab-content');
const farmerStatsTabContent = document.getElementById('farmer-stats-tab-content');

const tabNgoBrowse = document.getElementById('tab-ngo-browse');
const tabNgoRequests = document.getElementById('tab-ngo-requests');
const tabNgoHistory = document.getElementById('tab-ngo-history');
const tabNgoMap = document.getElementById('tab-ngo-map');
const tabNgoStats = document.getElementById('tab-ngo-stats');
const ngoBrowseTabContent = document.getElementById('ngo-browse-tab-content');
const ngoRequestsTabContent = document.getElementById('ngo-requests-tab-content');
const ngoHistoryTabContent = document.getElementById('ngo-history-tab-content');
const ngoMapTabContent = document.getElementById('ngo-map-tab-content');
const ngoStatsTabContent = document.getElementById('ngo-stats-tab-content');

const applyFiltersBtn = document.getElementById('apply-filters-btn');

// Geolocation refs
const regDetectBtn = document.getElementById('reg-detect-btn');
const regLocationDisplay = document.getElementById('reg-location-display');
const regLat = document.getElementById('reg-lat');
const regLng = document.getElementById('reg-lng');
const regLocStatus = document.getElementById('reg-loc-status');

const produceDetectBtn = document.getElementById('produce-detect-btn');
const produceLocation = document.getElementById('produce-location');
const produceLat = document.getElementById('produce-lat');
const produceLng = document.getElementById('produce-lng');
const produceLocStatus = document.getElementById('produce-loc-status');

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
        document.getElementById('reg-location-group').style.display = 'block';
        authSubmitBtn.textContent = 'Register';
        authToggleText.textContent = 'Already have an account?';
        authToggleLink.textContent = 'Login here';
        regNameInput.required = true;
    } else {
        authTitle.textContent = 'Welcome to FarmShare';
        authSubtitle.textContent = 'Login to connect surplus produce with those in need';
        nameGroup.style.display = 'none';
        roleGroup.style.display = 'none';
        document.getElementById('reg-location-group').style.display = 'none';
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
            const latVal = regLat.value;
            const lngVal = regLng.value;
            const latitude = latVal ? parseFloat(latVal) : null;
            const longitude = lngVal ? parseFloat(lngVal) : null;
            
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, latitude, longitude })
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

    const submitBtn = document.getElementById('submit-produce-btn');
    const uploadLabel = document.querySelector('.file-upload-wrapper span');
    
    // Disable submit and show uploading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading image...';
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    
    uploadLabel.textContent = 'Uploading to cloud... ⏳';

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
        uploadLabel.textContent = 'Change selected image';
    } catch (err) {
        showToast(err.message, 'error');
        uploadLabel.textContent = 'Upload failed. Click to try again.';
        produceImageUrl.value = '';
        imageUploadPreview.style.display = 'none';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Listing';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
});

uploadProduceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const latVal = produceLat.value;
    const lngVal = produceLng.value;

    const payload = {
        produce_name: document.getElementById('produce-name').value,
        quantity: parseFloat(document.getElementById('produce-quantity').value),
        harvest_date: document.getElementById('produce-date').value,
        location: document.getElementById('produce-location').value,
        image_url: produceImageUrl.value || null,
        latitude: latVal ? parseFloat(latVal) : null,
        longitude: lngVal ? parseFloat(lngVal) : null
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
        produceLat.value = '';
        produceLng.value = '';
        produceLocStatus.textContent = '';
        document.querySelector('.file-upload-wrapper span').textContent = 'Click to upload image';
        loadFarmerListings();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

function deactivateAllFarmerTabs() {
    tabFarmerListings.classList.remove('active');
    tabFarmerRequests.classList.remove('active');
    tabFarmerHistory.classList.remove('active');
    tabFarmerMap.classList.remove('active');
    tabFarmerStats.classList.remove('active');
    
    farmerListingsTabContent.style.display = 'none';
    farmerRequestsTabContent.style.display = 'none';
    farmerHistoryTabContent.style.display = 'none';
    farmerMapTabContent.style.display = 'none';
    farmerStatsTabContent.style.display = 'none';
}

tabFarmerListings.addEventListener('click', () => {
    deactivateAllFarmerTabs();
    tabFarmerListings.classList.add('active');
    farmerListingsTabContent.style.display = 'block';
    loadFarmerListings();
});

tabFarmerRequests.addEventListener('click', () => {
    deactivateAllFarmerTabs();
    tabFarmerRequests.classList.add('active');
    farmerRequestsTabContent.style.display = 'block';
    loadFarmerRequests();
});

tabFarmerHistory.addEventListener('click', () => {
    deactivateAllFarmerTabs();
    tabFarmerHistory.classList.add('active');
    farmerHistoryTabContent.style.display = 'block';
    loadFarmerHistory();
});

tabFarmerMap.addEventListener('click', () => {
    deactivateAllFarmerTabs();
    tabFarmerMap.classList.add('active');
    farmerMapTabContent.style.display = 'block';
    loadMap('Farmer');
});

tabFarmerStats.addEventListener('click', () => {
    deactivateAllFarmerTabs();
    tabFarmerStats.classList.add('active');
    farmerStatsTabContent.style.display = 'block';
    loadFarmerStats();
});

function deactivateAllNgoTabs() {
    tabNgoBrowse.classList.remove('active');
    tabNgoRequests.classList.remove('active');
    tabNgoHistory.classList.remove('active');
    tabNgoMap.classList.remove('active');
    tabNgoStats.classList.remove('active');
    
    ngoBrowseTabContent.style.display = 'none';
    ngoRequestsTabContent.style.display = 'none';
    ngoHistoryTabContent.style.display = 'none';
    ngoMapTabContent.style.display = 'none';
    ngoStatsTabContent.style.display = 'none';
}

tabNgoBrowse.addEventListener('click', () => {
    deactivateAllNgoTabs();
    tabNgoBrowse.classList.add('active');
    ngoBrowseTabContent.style.display = 'block';
    loadNgoBrowse();
});

tabNgoRequests.addEventListener('click', () => {
    deactivateAllNgoTabs();
    tabNgoRequests.classList.add('active');
    ngoRequestsTabContent.style.display = 'block';
    loadNgoRequests();
});

tabNgoHistory.addEventListener('click', () => {
    deactivateAllNgoTabs();
    tabNgoHistory.classList.add('active');
    ngoHistoryTabContent.style.display = 'block';
    loadNgoHistory();
});

tabNgoMap.addEventListener('click', () => {
    deactivateAllNgoTabs();
    tabNgoMap.classList.add('active');
    ngoMapTabContent.style.display = 'block';
    loadMap('NGO');
});

tabNgoStats.addEventListener('click', () => {
    deactivateAllNgoTabs();
    tabNgoStats.classList.add('active');
    ngoStatsTabContent.style.display = 'block';
    loadNgoStats();
});

applyFiltersBtn.addEventListener('click', () => {
    loadNgoBrowse();
});

async function loadFarmerDashboard() {
    loadFarmerListings();
    loadFarmerRequests();
}

// NGO Geolocation state & distance calculators
let ngoCurrentCoords = null;

async function fetchOSRMDistance(lat1, lon1, lat2, lon2) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("OSRM routing failed");
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return data.routes[0].distance / 1000; // convert meters to km
    }
    throw new Error("No route found in OSRM response");
}

function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// =============================================
// AI SMART MATCHING — Scoring Engine
// =============================================

/**
 * Computes a 0–100 match score for a produce item relative to the NGO's location.
 * Weights: Distance 40%, Freshness 35%, Quantity 15%, Availability 10%
 */
function computeMatchScore(item, ngoCoords) {
    let score = 0;

    // --- Distance Score (40%) ---
    if (item.distance !== null && item.distance !== undefined) {
        const MAX_KM = 50;
        const distScore = Math.max(0, 1 - item.distance / MAX_KM);
        score += distScore * 40;
    } else if (!ngoCoords) {
        // No location data at all — give partial credit so items still rank
        score += 20;
    }

    // --- Freshness Score (35%) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const harvest = new Date(item.harvest_date);
    harvest.setHours(0, 0, 0, 0);
    const daysOld = Math.max(0, (today - harvest) / (1000 * 60 * 60 * 24));
    const MAX_DAYS = 7;
    const freshnessScore = Math.max(0, 1 - daysOld / MAX_DAYS);
    score += freshnessScore * 35;

    // --- Quantity Score (15%) ---
    const MAX_KG = 500;
    const qtyScore = Math.min(1, item.quantity / MAX_KG);
    score += qtyScore * 15;

    // --- Availability Score (10%) ---
    if (item.status === 'available') {
        score += 10;
    } else if (item.status === 'requested') {
        score += 5;
    }

    return Math.round(score);
}

/**
 * Generates human-readable match reason bullets for the hero card.
 */
function buildMatchReasons(item, ngoCoords) {
    const reasons = [];

    // Distance reason
    if (item.distance !== null && item.distance !== undefined) {
        if (item.distance < 5) {
            reasons.push(`Just ${item.distance.toFixed(1)} km away — very close`);
        } else if (item.distance < 20) {
            reasons.push(`${item.distance.toFixed(1)} km away — can collect today`);
        } else {
            reasons.push(`${item.distance.toFixed(1)} km away`);
        }
    } else {
        reasons.push(`Nearest available listing`);
    }

    // Freshness reason
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const harvest = new Date(item.harvest_date);
    harvest.setHours(0, 0, 0, 0);
    const daysOld = Math.max(0, (today - harvest) / (1000 * 60 * 60 * 24));
    if (daysOld === 0) {
        reasons.push('Harvested today — maximum freshness');
    } else if (daysOld === 1) {
        reasons.push('Harvested yesterday — very fresh');
    } else if (daysOld <= 3) {
        reasons.push(`Harvested ${daysOld} days ago — still fresh`);
    } else {
        reasons.push(`Needs urgent pickup — harvested ${daysOld} days ago`);
    }

    // Quantity reason
    if (item.quantity >= 200) {
        reasons.push(`Large donation: ${item.quantity} kg — high impact`);
    } else if (item.quantity >= 50) {
        reasons.push(`Good quantity: ${item.quantity} kg available`);
    } else {
        reasons.push(`${item.quantity} kg available`);
    }

    return reasons;
}

/**
 * Returns an urgency badge HTML string based on harvest date.
 */
function getFreshnessUrgency(harvestDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const harvest = new Date(harvestDateStr);
    harvest.setHours(0, 0, 0, 0);
    const daysOld = Math.max(0, (today - harvest) / (1000 * 60 * 60 * 24));

    if (daysOld >= 6) {
        return `<span class="urgency-badge urgency-critical">⚠️ Donate within 24 hrs</span>`;
    } else if (daysOld >= 4) {
        return `<span class="urgency-badge urgency-high">⚠️ Donate within 48 hrs</span>`;
    } else if (daysOld >= 2) {
        return `<span class="urgency-badge urgency-medium">🕐 Donate within 5 days</span>`;
    } else {
        return `<span class="urgency-badge urgency-fresh">✅ Fresh</span>`;
    }
}

async function loadNgoDashboard() {
    // Attempt to get live geolocation first
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                ngoCurrentCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                loadNgoBrowse();
                loadNgoRequests();
            },
            (error) => {
                console.warn("Live location failed or denied. Falling back to profile location.", error);
                if (currentUser && currentUser.latitude && currentUser.longitude) {
                    ngoCurrentCoords = {
                        lat: currentUser.latitude,
                        lng: currentUser.longitude
                    };
                } else {
                    ngoCurrentCoords = null;
                }
                loadNgoBrowse();
                loadNgoRequests();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        if (currentUser && currentUser.latitude && currentUser.longitude) {
            ngoCurrentCoords = {
                lat: currentUser.latitude,
                lng: currentUser.longitude
            };
        } else {
            ngoCurrentCoords = null;
        }
        loadNgoBrowse();
        loadNgoRequests();
    }
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
                    ${getFreshnessUrgency(item.harvest_date)}
                    <div class="produce-meta" style="margin-top: 0.5rem;">
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
    listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">🤖 Finding best matches for you...</div>';

    const filterName = document.getElementById('filter-name').value;
    const filterLocation = document.getElementById('filter-location').value;
    const filterStatus = document.getElementById('filter-status').value;

    try {
        // Build smart-match URL with NGO location for server-side scoring
        const matchParams = new URLSearchParams({ limit: 100 });
        if (ngoCurrentCoords) {
            matchParams.append('lat', ngoCurrentCoords.lat);
            matchParams.append('lng', ngoCurrentCoords.lng);
        }

        const response = await fetch(`${API_BASE}/match/smart?${matchParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch smart matches');

        const data = await response.json();
        let items = data.items;

        // Apply client-side filters on top of server results
        if (filterName) items = items.filter(i => i.produce_name.toLowerCase().includes(filterName.toLowerCase()));
        if (filterLocation) items = items.filter(i => i.location.toLowerCase().includes(filterLocation.toLowerCase()));
        if (filterStatus) items = items.filter(i => i.status === filterStatus);

        if (items.length === 0) {
            listEl.innerHTML = '<div class="no-data" style="grid-column: 1/-1;">No produce matches your criteria.</div>';
            return;
        }

        // Best match is always the first available item (already sorted by backend)
        const bestMatch = items.find(i => i.status === 'available');

        // Render best-match hero card
        let heroHtml = '';
        if (bestMatch && bestMatch.match_score !== undefined) {
            const reasons = bestMatch.match_reasons || buildMatchReasons(bestMatch, ngoCurrentCoords);
            const score = bestMatch.match_score;
            const deg = Math.round((score / 100) * 360);
            heroHtml = `
                <div class="best-match-section">
                    <div class="best-match-label">🤖 AI Smart Match — Top Pick For You</div>
                    <div class="best-match-hero">
                        <div class="match-score-ring" style="--score-deg: ${deg}deg">
                            <div class="match-score-text">
                                <span class="match-score-pct">${score}%</span>
                                <span class="match-score-sub">Match</span>
                            </div>
                        </div>
                        <div class="best-match-body">
                            <p class="best-match-produce-name">${bestMatch.produce_name}</p>
                            <p class="best-match-farmer">by ${bestMatch.farmer_name || 'Anonymous Farmer'} · ${bestMatch.location}</p>
                            <ul class="match-reasons">
                                ${reasons.map(r => `<li>${r}</li>`).join('')}
                            </ul>
                            <div class="best-match-actions">
                                <button class="btn-gold" onclick="requestPickup('${bestMatch.id}')">⚡ Request Pickup</button>
                                <div class="best-match-meta">
                                    <span>📦 ${bestMatch.quantity} kg</span>
                                    <span>📅 ${bestMatch.harvest_date}</span>
                                    ${bestMatch.distance_km !== null && bestMatch.distance_km !== undefined ? `<span>📍 ${bestMatch.distance_km.toFixed(1)} km</span>` : ''}
                                    <span style="font-weight:600; color:#d97706;">${bestMatch.urgency_label || ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="browse-section-label">All Available Produce</div>
            `;
        }

        listEl.innerHTML = heroHtml + items.map(item => `
            <div class="produce-card">
                <div class="produce-img-box">
                    <img class="produce-img" src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}" alt="${item.produce_name}">
                    <span class="produce-status-badge badge-${item.status}">${item.status.replace('_', ' ')}</span>
                </div>
                <div class="produce-info">
                    <h4 class="produce-title">${item.produce_name}</h4>
                    <span class="urgency-badge urgency-${item.urgency_level || 'fresh'}">${item.urgency_label || '✅ Fresh'}</span>
                    <div class="produce-meta" style="margin-top: 0.5rem;">
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
                    ${item.distance_km !== null && item.distance_km !== undefined ? `
                    <div class="produce-meta" style="color: #10b981; font-weight: 600; margin-top: 0.25rem;">
                        <span class="produce-meta-label">📍 Distance:</span>
                        <span>${item.distance_km.toFixed(1)} km away</span>
                    </div>
                    ` : ''}
                    ${item.match_score !== undefined ? `
                    <div class="produce-meta" style="color: #b45309; font-weight: 600;">
                        <span class="produce-meta-label">🤖 Match:</span>
                        <span>${item.match_score}%</span>
                    </div>
                    ` : ''}
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

// Geolocation logic
async function detectLocation(latInputId, lngInputId, displayInputId, statusId) {
    const latInput = document.getElementById(latInputId);
    const lngInput = document.getElementById(lngInputId);
    const displayInput = document.getElementById(displayInputId);
    const statusEl = document.getElementById(statusId);

    if (!navigator.geolocation) {
        statusEl.textContent = "Geolocation is not supported by your browser.";
        statusEl.style.color = "var(--danger)";
        return;
    }

    statusEl.textContent = "Locating...";
    statusEl.style.color = "#16a34a";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            latInput.value = lat;
            lngInput.value = lng;

            statusEl.textContent = "Fetching address...";
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                if (!response.ok) throw new Error("Failed reverse geocoding");
                const data = await response.json();
                const address = data.display_name || `${lat}, ${lng}`;
                displayInput.value = address;
                statusEl.textContent = "Location detected successfully.";
                statusEl.style.color = "#16a34a";
            } catch (err) {
                console.error(err);
                displayInput.value = `${lat}, ${lng}`;
                statusEl.textContent = "Location detected (could not fetch address).";
                statusEl.style.color = "#d97706";
            }
        },
        (error) => {
            console.error(error);
            let msg = "Unable to retrieve your location.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Location permission denied. Please enter address manually.";
            }
            statusEl.textContent = msg;
            statusEl.style.color = "var(--danger)";
            displayInput.readOnly = false;
            displayInput.placeholder = "Enter address manually...";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

regDetectBtn.addEventListener('click', () => {
    detectLocation('reg-lat', 'reg-lng', 'reg-location-display', 'reg-loc-status');
});

produceDetectBtn.addEventListener('click', () => {
    detectLocation('produce-lat', 'produce-lng', 'produce-location', 'produce-loc-status');
});

// Leaflet Map Logic
let farmerMapInstance = null;
let ngoMapInstance = null;

async function loadMap(role) {
    const mapId = role === 'Farmer' ? 'farmer-map' : 'ngo-map';
    
    try {
        const response = await fetch(`${API_BASE}/map/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load map data');
        const data = await response.json();

        // Clear existing map instance to re-initialize safely
        if (role === 'Farmer' && farmerMapInstance) {
            farmerMapInstance.remove();
            farmerMapInstance = null;
        } else if (role === 'NGO' && ngoMapInstance) {
            ngoMapInstance.remove();
            ngoMapInstance = null;
        }

        const map = L.map(mapId).setView([20.5937, 78.9629], 5);
        if (role === 'Farmer') {
            farmerMapInstance = map;
        } else {
            ngoMapInstance = map;
        }

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const markers = [];

        const greenIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const blueIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        data.farmers.forEach(farmer => {
            if (farmer.lat && farmer.lng) {
                const marker = L.marker([farmer.lat, farmer.lng], { icon: greenIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: sans-serif; line-height: 1.4;">
                            <h4 style="margin: 0 0 4px 0; color: #16a34a; font-weight: bold;">🌾 ${farmer.name}</h4>
                            <p style="margin: 0 0 2px 0;"><strong>Produce:</strong> ${farmer.produce_name}</p>
                            <p style="margin: 0 0 2px 0;"><strong>Quantity:</strong> ${farmer.quantity} kg</p>
                            <p style="margin: 0 0 2px 0;"><strong>Status:</strong> <span class="badge-${farmer.status}" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;">${farmer.status.replace('_', ' ')}</span></p>
                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📍 ${farmer.location}</p>
                        </div>
                    `);
                markers.push(marker);
            }
        });

        data.ngos.forEach(ngo => {
            if (ngo.lat && ngo.lng) {
                const marker = L.marker([ngo.lat, ngo.lng], { icon: blueIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: sans-serif; line-height: 1.4;">
                            <h4 style="margin: 0 0 4px 0; color: #2563eb; font-weight: bold;">🏢 ${ngo.name}</h4>
                            <p style="margin: 0 0 2px 0;"><strong>Type:</strong> NGO / Food Bank</p>
                            <p style="margin: 0 0 2px 0;"><strong>Status:</strong> Active</p>
                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📍 Registered Partner</p>
                        </div>
                    `);
                markers.push(marker);
            }
        });

        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// Analytics Logic
async function loadFarmerStats() {
    const container = document.getElementById('farmer-stats-container');
    container.innerHTML = `<div class="stat-skeleton h-48 w-full rounded-2xl"></div>`;
    try {
        const response = await fetch(`${API_BASE}/stats/farmer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-2xl">🌾</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Uploaded</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.total_uploaded}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-xl text-2xl">📋</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Listings</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.active_listings}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-amber-50 text-amber-600 rounded-xl text-2xl">⏳</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Requests</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.pending_requests}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-purple-50 text-purple-600 rounded-xl text-2xl">📦</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Donations</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.completed_donations}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 md:col-span-2">
                    <div class="p-3 bg-teal-50 text-teal-600 rounded-xl text-2xl">⚖️</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Produce Donated</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.total_kg_donated} kg</h3>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="text-red-500 font-medium">${err.message}</div>`;
    }
}

async function loadNgoStats() {
    const container = document.getElementById('ngo-stats-container');
    container.innerHTML = `<div class="stat-skeleton h-48 w-full rounded-2xl"></div>`;
    try {
        const response = await fetch(`${API_BASE}/stats/ngo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-xl text-2xl">📤</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Requests Sent</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.total_requests}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-amber-50 text-amber-600 rounded-xl text-2xl">🤝</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Accepted (Scheduled)</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.accepted_requests}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-2xl">✓</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Deliveries</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.completed_deliveries}</h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div class="p-3 bg-teal-50 text-teal-600 rounded-xl text-2xl">⚖️</div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Quantity Received</p>
                        <h3 class="text-2xl font-bold text-slate-800">${data.total_kg_received} kg</h3>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="text-red-500 font-medium">${err.message}</div>`;
    }
}

async function initApp() {
    if (!token || !currentUser) {
        showView('auth');
        return;
    }

    try {
        // Validate token is still alive by hitting a lightweight authenticated endpoint
        const res = await fetch(`${API_BASE}/stats/platform`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            // Token invalid or expired — clear and redirect to login
            throw new Error('Session expired');
        }

        // Normalise role: "Food Bank" users share the NGO view
        const role = currentUser.role === 'Food Bank' ? 'NGO' : currentUser.role;
        showView(role);

    } catch (err) {
        // Clear stale session data
        token = null;
        currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showView('auth');
        if (err.message !== 'Session expired') {
            showToast('Session expired. Please login again.', 'warning');
        }
    }
}

initApp();
