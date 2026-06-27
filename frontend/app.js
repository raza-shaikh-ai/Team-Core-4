//const API_BASE = 'http://localhost:8000';
const API_BASE = 'https://api.razadev.online';

let token = localStorage.getItem('token') || null;
let currentUser = null;
try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) currentUser = JSON.parse(savedUser);
} catch (e) {
    localStorage.removeItem('user');
}

let currentLang = localStorage.getItem('lang') || 'en';

function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.value = lang;
    }

    // Static translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[lang][key]) {
            el.textContent = TRANSLATIONS[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[lang][key]) {
            el.placeholder = TRANSLATIONS[lang][key];
        }
    });

    updateAuthToggleTexts();
    refreshActiveViewContent();
}

function updateAuthToggleTexts() {
    const dict = TRANSLATIONS[currentLang];
    if (!dict) return;
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const authToggleLink = document.getElementById('auth-toggle-link');

    if (isRegisterMode) {
        if (authTitle) authTitle.textContent = dict.register_title;
        if (authSubtitle) authSubtitle.textContent = dict.register_subtitle;
        if (authSubmitBtn) authSubmitBtn.textContent = dict.btn_register;
        if (authToggleText) authToggleText.textContent = dict.toggle_text_register;
        if (authToggleLink) authToggleLink.textContent = dict.toggle_link_register;
    } else {
        if (authTitle) authTitle.textContent = dict.login_title;
        if (authSubtitle) authSubtitle.textContent = dict.login_subtitle;
        if (authSubmitBtn) authSubmitBtn.textContent = dict.btn_login;
        if (authToggleText) authToggleText.textContent = dict.toggle_text_login;
        if (authToggleLink) authToggleLink.textContent = dict.toggle_link_login;
    }
}

function refreshActiveViewContent() {
    if (authView && authView.classList.contains('active')) {
        updateAuthToggleTexts();
    }
    if (farmerView && farmerView.classList.contains('active')) {
        if (tabFarmerListings.classList.contains('active')) {
            loadFarmerListings();
        } else if (tabFarmerRequests.classList.contains('active')) {
            loadFarmerRequests();
        } else if (tabFarmerHistory.classList.contains('active')) {
            loadFarmerHistory();
        } else if (tabFarmerMap.classList.contains('active')) {
            loadMap('Farmer');
        } else if (tabFarmerStats.classList.contains('active')) {
            loadFarmerStats();
        }
    }
    if (ngoView && ngoView.classList.contains('active')) {
        if (tabNgoBrowse.classList.contains('active')) {
            loadNgoBrowse();
        } else if (tabNgoRequests.classList.contains('active')) {
            loadNgoRequests();
        } else if (tabNgoHistory.classList.contains('active')) {
            loadNgoHistory();
        } else if (tabNgoMap.classList.contains('active')) {
            loadMap('NGO');
        } else if (tabNgoStats.classList.contains('active')) {
            loadNgoStats();
        }
    }
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
        if (typeof window.initInlineVoiceStrip === 'function') window.initInlineVoiceStrip();
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
        let roleText = currentUser.role;
        if (TRANSLATIONS[currentLang]) {
            if (currentUser.role === 'Farmer') {
                roleText = TRANSLATIONS[currentLang].role_farmer || currentUser.role;
            } else if (currentUser.role === 'NGO' || currentUser.role === 'Food Bank') {
                roleText = TRANSLATIONS[currentLang].role_ngo || currentUser.role;
            }
        }
        userRoleLabel.textContent = roleText;
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const msg = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_logged_out) || 'Logged out successfully';
    showToast(msg, 'info');
    showView('auth');
}

authToggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;

    if (isRegisterMode) {
        nameGroup.style.display = 'block';
        roleGroup.style.display = 'block';
        document.getElementById('reg-location-group').style.display = 'block';
        regNameInput.required = true;
    } else {
        nameGroup.style.display = 'none';
        roleGroup.style.display = 'none';
        document.getElementById('reg-location-group').style.display = 'none';
        regNameInput.required = false;
    }
    updateAuthToggleTexts();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    const authLoadingOverlay = document.getElementById('auth-loading-overlay');
    const authLoadingMsg     = document.getElementById('auth-loading-msg');
    const authSubmitBtn      = document.getElementById('auth-submit-btn');

    const showAuthLoader = (msg) => {
        authLoadingMsg.textContent = msg;
        authLoadingOverlay.style.display = 'flex';
        authSubmitBtn.disabled = true;
        authSubmitBtn.style.opacity = '0.6';
    };

    const hideAuthLoader = () => {
        authLoadingOverlay.style.display = 'none';
        authSubmitBtn.disabled = false;
        authSubmitBtn.style.opacity = '1';
    };

    try {
        if (isRegisterMode) {
            const name = regNameInput.value;
            const role = document.querySelector('input[name="user-role"]:checked').value;
            const latVal = regLat.value;
            const lngVal = regLng.value;
            const latitude = latVal ? parseFloat(latVal) : null;
            const longitude = lngVal ? parseFloat(lngVal) : null;

            showAuthLoader('Creating your account…');

            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, latitude, longitude })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Registration failed');
            }

            authLoadingMsg.textContent = 'Sending verification email…';

            const data = await response.json();
            hideAuthLoader();
            otpEmailInput.value = email;
            otpCodeInput.value = '';
            showToast(data.message || (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_otp_sent) || 'OTP verification code sent');
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
            const welcomeMsg = ((TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_welcome_back) || 'Welcome back, ') + currentUser.name;
            showToast(welcomeMsg);
            showView(currentUser.role);
        }
    } catch (err) {
        hideAuthLoader();
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
        const verifiedMsg = ((TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_welcome_user) || 'Verification successful! Welcome, ') + currentUser.name;
        showToast(verifiedMsg);
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
    const uploadWrapper = document.querySelector('.file-upload-wrapper');
    const uploadLabel = document.querySelector('.file-upload-wrapper span');

    // Clear any previous rejection state when a new file is selected
    uploadWrapper.style.border = '';
    uploadWrapper.style.background = '';
    const existingRejectionMsg = document.getElementById('ai-rejection-msg');
    if (existingRejectionMsg) existingRejectionMsg.remove();

    // Disable submit and show uploading state
    submitBtn.disabled = true;
    submitBtn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_uploading_image) || 'Uploading image...';
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    uploadLabel.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_uploading_cloud) || '🔍 Validating image with AI...';

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
            const isAiRejection = response.status === 422;
            const errMsg = err.detail || 'Failed to upload image';
            throw Object.assign(new Error(errMsg), { isAiRejection });
        }

        const data = await response.json();
        produceImageUrl.value = data.url;
        imageUploadPreview.src = data.url;
        imageUploadPreview.style.display = 'block';
        // Show success state on wrapper
        uploadWrapper.style.border = '2px solid #10B981';
        showToast((TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_image_success) || '✅ Image uploaded successfully');
        uploadLabel.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_upload_change) || 'Change selected image';

    } catch (err) {
        produceImageUrl.value = '';
        imageUploadPreview.style.display = 'none';

        if (err.isAiRejection) {
            // ── AI Moderation Rejection ──────────────────────────────────────────
            // Show a clear, permanent visual rejection state so the farmer
            // understands exactly why the image was blocked.
            uploadWrapper.style.border = '2px solid #EF4444';
            uploadWrapper.style.background = 'rgba(239,68,68,0.07)';
            uploadLabel.textContent = '🚫 Image rejected by AI';

            // Inject a descriptive rejection banner below the upload wrapper
            const rejectionEl = document.createElement('div');
            rejectionEl.id = 'ai-rejection-msg';
            rejectionEl.style.cssText = [
                'margin-top:8px',
                'padding:10px 14px',
                'background:rgba(239,68,68,0.12)',
                'border:1px solid rgba(239,68,68,0.4)',
                'border-radius:8px',
                'color:#FCA5A5',
                'font-size:0.82rem',
                'line-height:1.5'
            ].join(';');
            // Strip internal tech detail — show only the human-readable part
            const cleanMsg = (err.message || '').replace(/Image rejected by AI moderation:\s*/i, '');
            rejectionEl.innerHTML = `<strong>⚠️ AI Moderation Blocked This Image</strong><br>${cleanMsg || 'Please upload a clear photo of the surplus produce (fruits, vegetables, grains, etc.).'}`;
            uploadWrapper.parentNode.insertBefore(rejectionEl, uploadWrapper.nextSibling);

            showToast('Image rejected: Not food/produce related', 'error');
        } else {
            // Generic upload error
            uploadWrapper.style.border = '2px solid #EF4444';
            uploadLabel.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_upload_fail) || 'Upload failed. Click to try again.';
            showToast(err.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btn_submit_listing) || 'Submit Listing';
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

        showToast((TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].toast_produce_success) || 'Produce listing shared successfully');
        uploadProduceForm.reset();
        imageUploadPreview.style.display = 'none';
        produceLat.value = '';
        produceLng.value = '';
        produceLocStatus.textContent = '';
        document.querySelector('.file-upload-wrapper span').textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].image_upload_prompt) || 'Click to upload image';
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
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    // Distance reason
    if (item.distance !== null && item.distance !== undefined) {
        if (item.distance < 5) {
            reasons.push((dict.reason_distance_close || "Just {dist} km away — very close").replace('{dist}', item.distance.toFixed(1)));
        } else if (item.distance < 20) {
            reasons.push((dict.reason_distance_near || "{dist} km away — can collect today").replace('{dist}', item.distance.toFixed(1)));
        } else {
            reasons.push((dict.reason_distance_far || "{dist} km away").replace('{dist}', item.distance.toFixed(1)));
        }
    } else {
        reasons.push(dict.reason_distance_nearest || "Nearest available listing");
    }

    // Freshness reason
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const harvest = new Date(item.harvest_date);
    harvest.setHours(0, 0, 0, 0);
    const daysOld = Math.max(0, (today - harvest) / (1000 * 60 * 60 * 24));
    if (daysOld === 0) {
        reasons.push(dict.reason_harvest_today || 'Harvested today — maximum freshness');
    } else if (daysOld === 1) {
        reasons.push(dict.reason_harvest_yesterday || 'Harvested yesterday — very fresh');
    } else if (daysOld <= 3) {
        reasons.push((dict.reason_harvest_recent || "Harvested {days} days ago — still fresh").replace('{days}', daysOld));
    } else {
        reasons.push((dict.reason_harvest_urgent || "Needs urgent pickup — harvested {days} days ago").replace('{days}', daysOld));
    }

    // Quantity reason
    if (item.quantity >= 200) {
        reasons.push((dict.reason_quantity_large || "Large donation: {qty} kg — high impact").replace('{qty}', item.quantity));
    } else if (item.quantity >= 50) {
        reasons.push((dict.reason_quantity_good || "Good quantity: {qty} kg available").replace('{qty}', item.quantity));
    } else {
        reasons.push((dict.reason_quantity_small || "{qty} kg available").replace('{qty}', item.quantity));
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
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    if (daysOld >= 6) {
        return `<span class="urgency-badge urgency-critical">${dict.urgency_critical || '⚠️ Donate within 24 hrs'}</span>`;
    } else if (daysOld >= 4) {
        return `<span class="urgency-badge urgency-high">${dict.urgency_high || '⚠️ Donate within 48 hrs'}</span>`;
    } else if (daysOld >= 2) {
        return `<span class="urgency-badge urgency-medium">${dict.urgency_medium || '🕐 Donate within 5 days'}</span>`;
    } else {
        return `<span class="urgency-badge urgency-fresh">${dict.urgency_fresh || '✅ Fresh'}</span>`;
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
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/produce/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load listings');

        const all = await response.json();
        const items = all.filter(i => i.status !== 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">${dict.no_active_listings || 'No active listings. Delivered items appear in History.'}</div>`;
            return;
        }

        listEl.innerHTML = items.map(item => {
            const statusKey = 'status_' + item.status;
            const statusText = dict[statusKey] || item.status.replace('_', ' ');
            const qtyLabel = dict.meta_quantity || 'Quantity:';
            const harvestLabel = dict.meta_harvest || 'Harvest:';
            const locationLabel = dict.meta_location || 'Location:';
            const deleteBtnText = dict.btn_delete || 'Delete';

            return `
                <div class="produce-card">
                    <div class="produce-img-box">
                        <img class="produce-img" src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}" alt="${item.produce_name}">
                        <span class="produce-status-badge badge-${item.status}">${statusText}</span>
                    </div>
                    <div class="produce-info">
                        <h4 class="produce-title">${item.produce_name}</h4>
                        ${getFreshnessUrgency(item.harvest_date)}
                        <div class="produce-meta" style="margin-top: 0.5rem;">
                            <span class="produce-meta-label">${qtyLabel}</span>
                            <span>${item.quantity} kg</span>
                        </div>
                        <div class="produce-meta">
                            <span class="produce-meta-label">${harvestLabel}</span>
                            <span>${item.harvest_date}</span>
                        </div>
                        <div class="produce-meta">
                            <span class="produce-meta-label">${locationLabel}</span>
                            <span>${item.location}</span>
                        </div>
                    </div>
                    <div class="produce-footer">
                        <button class="btn btn-danger btn-sm" onclick="deleteProduce('${item.id}')">${deleteBtnText}</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function deleteProduce(id) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!confirm(dict.confirm_delete || 'Are you sure you want to delete this listing?')) return;
    try {
        const response = await fetch(`${API_BASE}/produce/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete produce');

        showToast(dict.toast_produce_deleted || 'Produce listing deleted');
        loadFarmerListings();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.deleteProduce = deleteProduce;

async function loadFarmerRequests() {
    const listEl = document.getElementById('farmer-requests-list');
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/requests/incoming`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load incoming requests');

        const items = await response.json();
        if (items.length === 0) {
            listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">${dict.no_incoming_requests || 'No incoming requests yet.'}</div>`;
            return;
        }

        listEl.innerHTML = items.map(item => {
            const statusKey = 'status_' + item.status;
            const statusText = dict[statusKey] || item.status;
            const ngoLabel = dict.detail_ngo || 'NGO:';
            const qtyLabel = dict.meta_quantity || 'Quantity:';
            const locationLabel = dict.meta_location || 'Location:';
            const requestedLabel = dict.detail_requested || 'Requested:';
            const acceptBtnText = dict.btn_accept || 'Accept';
            const rejectBtnText = dict.btn_reject || 'Reject';

            return `
                <div class="request-card">
                    <div class="request-header">
                        <h4 class="produce-title">${item.produce_name}</h4>
                        <span class="produce-status-badge badge-${item.status}">${statusText}</span>
                    </div>
                    <div class="request-detail-grid">
                        <div><strong>${ngoLabel}</strong> ${item.ngo_name || 'Anonymous NGO'}</div>
                        <div><strong>${qtyLabel}</strong> ${item.quantity} kg</div>
                        <div><strong>${locationLabel}</strong> ${item.location}</div>
                        <div><strong>${requestedLabel}</strong> ${new Date(item.requested_at).toLocaleDateString()}</div>
                    </div>
                    ${item.status === 'pending' ? `
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                            <button class="btn btn-primary" onclick="updateRequestStatus('${item.id}', 'accept')">${acceptBtnText}</button>
                            <button class="btn btn-danger" onclick="updateRequestStatus('${item.id}', 'reject')">${rejectBtnText}</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function updateRequestStatus(id, action) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/requests/${id}/${action}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update request');
        }

        const actionText = action === 'accept' ? (dict.btn_accept || 'Accept') : (dict.btn_reject || 'Reject');
        const successMsg = (dict.toast_request_action || "Request {action}ed successfully").replace('{action}', actionText.toLowerCase());
        showToast(successMsg);
        loadFarmerRequests();
        loadFarmerListings();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.updateRequestStatus = updateRequestStatus;

async function loadNgoBrowse() {
    const listEl = document.getElementById('ngo-produce-list');
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">🤖 ${(dict.loc_locating || 'Finding best matches for you...')}</div>`;

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
            listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">${dict.no_produce_criteria || 'No produce matches your criteria.'}</div>`;
            return;
        }

        // Best match is always the first available item (already sorted by backend)
        const bestMatch = items.find(i => i.status === 'available');

        // Render best-match hero card
        let heroHtml = '';
        if (bestMatch && bestMatch.match_score !== undefined) {
            const reasons = buildMatchReasons(bestMatch, ngoCurrentCoords);
            const score = bestMatch.match_score;
            const deg = Math.round((score / 100) * 360);

            const matchTitle = dict.ai_smart_match_title || "✨ AI Smart Match — Best Match For You";
            const aiRec = dict.ai_recommended || "AI RECOMMENDED";
            const matchPctLabel = dict.match_percentage || "Match";
            const harvestText = dict.meta_harvest || "Harvested:";
            const requestPickupText = dict.btn_request_pickup || "⚡ Request Pickup";
            const requestedText = dict.btn_requested || "Requested";

            // Localized urgency badge logic for bestMatch
            let bestMatchUrgencyBadge = '';
            if (bestMatch.harvest_date) {
                bestMatchUrgencyBadge = getFreshnessUrgency(bestMatch.harvest_date);
            }

            heroHtml = `
                <div class="best-match-section">
                    <div class="best-match-label">${matchTitle}</div>
                    <div class="best-match-card">
                        <div class="best-match-header-row">
                            <span class="best-match-badge"><span class="badge-sparkle">✨</span> ${aiRec}</span>
                            ${bestMatchUrgencyBadge}
                        </div>
                        <div class="best-match-content">
                            <div class="best-match-main-info">
                                <h3 class="best-match-produce-name">${bestMatch.produce_name}</h3>
                                <div class="best-match-farmer-info">
                                    <span class="farmer-avatar-circle">${(bestMatch.farmer_name || 'A').charAt(0).toUpperCase()}</span>
                                    <div class="best-match-farmer-details">
                                        <span class="best-match-farmer-name">${bestMatch.farmer_name || 'Anonymous Farmer'}</span>
                                        <span class="best-match-farmer-location">📍 ${bestMatch.location}</span>
                                    </div>
                                </div>
                                <ul class="match-reasons-list">
                                    ${reasons.map(r => `
                                        <li>
                                            <span class="reason-icon">✨</span>
                                            <span class="reason-text">${r}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div class="best-match-score-section">
                                <div class="best-match-score-ring" style="--score-deg: ${deg}deg">
                                    <div class="best-match-score-inner">
                                        <span class="best-match-score-pct">${score}%</span>
                                        <span class="best-match-score-text">${matchPctLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="best-match-footer">
                            <div class="best-match-stats">
                                <span class="best-match-stat-chip">📦 <strong>${bestMatch.quantity} kg</strong></span>
                                <span class="best-match-stat-chip">${harvestText} <strong>${bestMatch.harvest_date}</strong></span>
                                ${bestMatch.distance_km !== null && bestMatch.distance_km !== undefined ? `
                                    <span class="best-match-stat-chip distance">📍 <strong>${(dict.reason_distance_far || "{dist} km away").replace('{dist}', bestMatch.distance_km.toFixed(1))}</strong></span>
                                ` : ''}
                            </div>
                            <button class="best-match-pickup-btn" onclick="requestPickup('${bestMatch.id}')">${requestPickupText}</button>
                        </div>
                    </div>
                </div>
                <div class="browse-section-label">${dict.all_available_produce || "All Available Produce"}</div>
            `;
        }

        listEl.innerHTML = heroHtml + `<div class="product-showcase-grid">` + items.map((item, index) => {
            const matchScoreBadge = item.match_score !== undefined ? `
            <div class="product-score-badge">
                <span class="score-sparkle">✨</span> ${item.match_score}% ${dict.match_percentage || 'Match'}
            </div>` : '';

            const statusKey = 'status_' + item.status;
            const statusText = dict[statusKey] || item.status.replace('_', ' ');

            const qtyLabelText = (dict.meta_quantity || 'Quantity:').replace(':', '');
            const harvestLabelText = (dict.meta_harvest || 'Harvested:').replace(':', '');
            const farmerNameVal = item.farmer_name || 'Anonymous Farmer';

            let actionButton = '';
            if (item.status === 'available') {
                actionButton = `<button class="product-action-btn" onclick="requestPickup('${item.id}')">${dict.btn_request_pickup || '⚡ Request Pickup'}</button>`;
            } else {
                actionButton = `<button class="product-action-btn disabled" disabled>${statusText}</button>`;
            }

            return `
                <div class="product-card ${item.status}" style="--i:${index}">
                    <div class="product-image-box">
                        <img src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'}" alt="${item.produce_name}" class="product-img" loading="lazy">
                        
                        ${matchScoreBadge}
                        
                        <span class="product-status-badge status-${item.status}">
                            ${statusText}
                        </span>
                    </div>

                    <div class="product-body">
                        <div class="product-header-row">
                            ${getFreshnessUrgency(item.harvest_date)}
                            ${item.distance_km !== null && item.distance_km !== undefined ? `
                                <span class="product-distance-badge">📍 ${item.distance_km.toFixed(1)} km</span>
                            ` : ''}
                        </div>
                        
                        <h4 class="product-title" title="${item.produce_name}">${item.produce_name}</h4>
                        
                        <div class="product-farmer-info">
                            <span class="farmer-avatar">${(farmerNameVal).charAt(0).toUpperCase()}</span>
                            <div class="farmer-meta">
                                <span class="farmer-name">${farmerNameVal}</span>
                                <span class="farmer-location" title="${item.location}">${item.location}</span>
                            </div>
                        </div>
                        
                        <div class="product-specs">
                            <div class="spec-item">
                                <span class="spec-label">${qtyLabelText}</span>
                                <span class="spec-val">${item.quantity} kg</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">${harvestLabelText}</span>
                                <span class="spec-val">${item.harvest_date}</span>
                            </div>
                        </div>
                    </div>

                    <div class="product-footer">
                        ${actionButton}
                    </div>
                </div>
            `;
        }).join('') + `</div>`;
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function requestPickup(produceId) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/requests/${produceId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to request pickup');
        }

        showToast(dict.toast_request_success || 'Pickup request sent successfully');
        loadNgoBrowse();
        loadNgoRequests();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.requestPickup = requestPickup;

async function loadNgoRequests() {
    const listEl = document.getElementById('ngo-requests-list');
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/requests/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load my requests');

        const all = await response.json();
        const items = all.filter(i => i.status !== 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">${dict.no_active_requests || 'No active requests. Delivered items appear in History.'}</div>`;
            return;
        }

        listEl.innerHTML = items.map(item => {
            const statusKey = 'status_' + item.status;
            const statusText = dict[statusKey] || item.status;
            const farmerLabel = dict.detail_farmer || 'Farmer:';
            const qtyLabel = dict.meta_quantity || 'Quantity:';
            const locationLabel = dict.meta_location || 'Location:';
            const requestedLabel = dict.detail_requested || 'Requested:';
            const markDeliveredText = dict.btn_mark_delivered || 'Mark Delivered';

            return `
                <div class="request-card">
                    <div class="request-header">
                        <h4 class="produce-title">${item.produce_name}</h4>
                        <span class="produce-status-badge badge-${item.status}">${statusText}</span>
                    </div>
                    <div class="request-detail-grid">
                        <div><strong>${farmerLabel}</strong> ${item.farmer_name || 'Anonymous Farmer'}</div>
                        <div><strong>${qtyLabel}</strong> ${item.quantity} kg</div>
                        <div><strong>${locationLabel}</strong> ${item.location}</div>
                        <div><strong>${requestedLabel}</strong> ${new Date(item.requested_at).toLocaleDateString()}</div>
                    </div>
                    ${item.status === 'accepted' ? `
                        <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                            <button class="btn btn-primary" onclick="markAsDelivered('${item.id}')">${markDeliveredText}</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function markAsDelivered(requestId) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/requests/${requestId}/delivered`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update delivery status');
        }

        showToast(dict.toast_delivery_success || 'Pickup completed and marked as delivered');
        loadNgoRequests();
        loadNgoBrowse();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.markAsDelivered = markAsDelivered;

async function loadFarmerHistory() {
    const listEl = document.getElementById('farmer-history-list');
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/produce/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load history');

        const all = await response.json();
        const items = all.filter(i => i.status === 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">${dict.no_delivered_produce || 'No delivered produce yet. Completed donations will appear here.'}</div>`;
            return;
        }

        listEl.innerHTML = items.map(item => {
            const qtyLabel = dict.meta_quantity || 'Quantity:';
            const harvestLabel = dict.meta_harvest || 'Harvest:';
            const locationLabel = dict.meta_location || 'Location:';
            const deliveredBadge = dict.status_delivered || 'Delivered';

            return `
                <div class="produce-card" style="opacity: 0.85;">
                    <div class="produce-img-box">
                        <img class="produce-img" src="${item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}" alt="${item.produce_name}">
                        <span class="produce-status-badge badge-delivered">✓ ${deliveredBadge}</span>
                    </div>
                    <div class="produce-info">
                        <h4 class="produce-title">${item.produce_name}</h4>
                        <div class="produce-meta">
                            <span class="produce-meta-label">${qtyLabel}</span>
                            <span>${item.quantity} kg ${dict.status_delivered ? dict.status_delivered.toLowerCase() : 'donated'}</span>
                        </div>
                        <div class="produce-meta">
                            <span class="produce-meta-label">${harvestLabel}</span>
                            <span>${item.harvest_date}</span>
                        </div>
                        <div class="produce-meta">
                            <span class="produce-meta-label">${locationLabel}</span>
                            <span>${item.location}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1; color: var(--danger);">${err.message}</div>`;
    }
}

async function loadNgoHistory() {
    const listEl = document.getElementById('ngo-history-list');
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/requests/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load history');

        const all = await response.json();
        const items = all.filter(i => i.status === 'delivered');
        if (items.length === 0) {
            listEl.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">${dict.no_deliveries_completed || 'No deliveries completed yet. They will appear here once marked as delivered.'}</div>`;
            return;
        }

        listEl.innerHTML = items.map(item => {
            const farmerLabel = dict.detail_farmer || 'Farmer:';
            const qtyLabel = dict.meta_quantity || 'Quantity:';
            const locationLabel = dict.meta_location || 'Location:';
            const deliveredLabel = dict.detail_delivered || 'Delivered:';
            const deliveredBadgeText = dict.status_delivered || 'Delivered';

            return `
                <div class="request-card" style="opacity: 0.85;">
                    <div class="request-header">
                        <h4 class="produce-title">${item.produce_name}</h4>
                        <span class="produce-status-badge badge-delivered">✓ ${deliveredBadgeText}</span>
                    </div>
                    <div class="request-detail-grid">
                        <div><strong>${farmerLabel}</strong> ${item.farmer_name || 'Anonymous Farmer'}</div>
                        <div><strong>${qtyLabel}</strong> ${item.quantity} kg</div>
                        <div><strong>${locationLabel}</strong> ${item.location}</div>
                        <div><strong>${deliveredLabel}</strong> ${new Date(item.updated_at).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }).join('');
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
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    if (!navigator.geolocation) {
        statusEl.textContent = dict.loc_not_supported || "Geolocation is not supported by your browser.";
        statusEl.style.color = "var(--danger)";
        return;
    }

    statusEl.textContent = dict.loc_locating || "Locating...";
    statusEl.style.color = "#16a34a";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            latInput.value = lat;
            lngInput.value = lng;

            statusEl.textContent = dict.loc_fetching || "Fetching address...";
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                if (!response.ok) throw new Error("Failed reverse geocoding");
                const data = await response.json();
                const address = data.display_name || `${lat}, ${lng}`;
                displayInput.value = address;
                statusEl.textContent = dict.loc_success || "Location detected successfully.";
                statusEl.style.color = "#16a34a";
            } catch (err) {
                console.error(err);
                displayInput.value = `${lat}, ${lng}`;
                statusEl.textContent = dict.loc_fail || "Location detected (could not fetch address).";
                statusEl.style.color = "#d97706";
            }
        },
        (error) => {
            console.error(error);
            let msg = dict.loc_fail || "Unable to retrieve your location.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = dict.loc_denied || "Location permission denied. Please enter address manually.";
            }
            statusEl.textContent = msg;
            statusEl.style.color = "var(--danger)";
            displayInput.readOnly = false;
            displayInput.placeholder = dict.loc_placeholder_manual || "Enter address manually...";
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
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

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
                const statusKey = 'status_' + farmer.status;
                const statusText = dict[statusKey] || farmer.status.replace('_', ' ');
                const qtyLabelText = (dict.meta_quantity || 'Quantity:').replace(':', '');
                const produceLabelText = (dict.filter_label_name || 'Produce:').replace(':', '');
                const statusLabelText = (dict.filter_label_status || 'Status:').replace(':', '');

                const marker = L.marker([farmer.lat, farmer.lng], { icon: greenIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: sans-serif; line-height: 1.4;">
                            <h4 style="margin: 0 0 4px 0; color: #16a34a; font-weight: bold;">🌾 ${farmer.name}</h4>
                            <p style="margin: 0 0 2px 0;"><strong>${produceLabelText}:</strong> ${farmer.produce_name}</p>
                            <p style="margin: 0 0 2px 0;"><strong>${qtyLabelText}:</strong> ${farmer.quantity} kg</p>
                            <p style="margin: 0 0 2px 0;"><strong>${statusLabelText}:</strong> <span class="badge-${farmer.status}" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;">${statusText}</span></p>
                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📍 ${farmer.location}</p>
                        </div>
                    `);
                markers.push(marker);
            }
        });

        data.ngos.forEach(ngo => {
            if (ngo.lat && ngo.lng) {
                const ngoType = dict.role_ngo || 'NGO / Food Bank';
                const statusText = dict.status_available || 'Active'; // standard active status

                const marker = L.marker([ngo.lat, ngo.lng], { icon: blueIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: sans-serif; line-height: 1.4;">
                            <h4 style="margin: 0 0 4px 0; color: #2563eb; font-weight: bold;">🏢 ${ngo.name}</h4>
                            <p style="margin: 0 0 2px 0;"><strong>Type:</strong> ${ngoType}</p>
                            <p style="margin: 0 0 2px 0;"><strong>Status:</strong> ${statusText}</p>
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
    container.innerHTML = `<div class="stat-skeleton" style="height:180px;width:100%;"></div>`;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/stats/farmer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        container.innerHTML = `
            <div class="stats-section-header">
                <h3 class="stats-section-title">📊 ${dict.analytics_farmer_title || 'Your Impact Dashboard'}</h3>
                <p class="stats-section-sub">${dict.analytics_farmer_sub || 'Summary of your farming & donation activity'}</p>
            </div>
            <div class="stat-grid">
                <div class="stat-card stat-card-green">
                    <div class="stat-icon">🌾</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_total_uploaded || 'Total Uploaded'}</p>
                        <h3 class="stat-value">${data.total_uploaded}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-blue">
                    <div class="stat-icon">📋</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_active_listings || 'Active Listings'}</p>
                        <h3 class="stat-value">${data.active_listings}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-amber">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_pending_requests || 'Pending Requests'}</p>
                        <h3 class="stat-value">${data.pending_requests}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-purple">
                    <div class="stat-icon">📦</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_completed_donations || 'Completed Donations'}</p>
                        <h3 class="stat-value">${data.completed_donations}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-teal stat-card-wide">
                    <div class="stat-icon">⚖️</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_total_donated || 'Total Produce Donated'}</p>
                        <h3 class="stat-value">${data.total_kg_donated} <span class="stat-unit">kg</span></h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="stats-error">⚠️ ${err.message}</div>`;
    }
}

async function loadNgoStats() {
    const container = document.getElementById('ngo-stats-container');
    container.innerHTML = `<div class="stat-skeleton" style="height:180px;width:100%;"></div>`;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    try {
        const response = await fetch(`${API_BASE}/stats/ngo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        container.innerHTML = `
            <div class="stats-section-header">
                <h3 class="stats-section-title">📊 ${dict.analytics_ngo_title || 'Your NGO Impact Overview'}</h3>
                <p class="stats-section-sub">${dict.analytics_ngo_sub || 'Track your food rescue and distribution activity'}</p>
            </div>
            <div class="stat-grid">
                <div class="stat-card stat-card-blue">
                    <div class="stat-icon">📤</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_total_sent || 'Total Requests Sent'}</p>
                        <h3 class="stat-value">${data.total_requests}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-amber">
                    <div class="stat-icon">🤝</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_accepted_scheduled || 'Accepted & Scheduled'}</p>
                        <h3 class="stat-value">${data.accepted_requests}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-green">
                    <div class="stat-icon">✅</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_completed_deliveries || 'Completed Deliveries'}</p>
                        <h3 class="stat-value">${data.completed_deliveries}</h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
                <div class="stat-card stat-card-teal">
                    <div class="stat-icon">⚖️</div>
                    <div class="stat-info">
                        <p class="stat-label">${dict.stat_total_received || 'Total Quantity Received'}</p>
                        <h3 class="stat-value">${data.total_kg_received} <span class="stat-unit">kg</span></h3>
                    </div>
                    <div class="stat-decoration"></div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="stats-error">⚠️ ${err.message}</div>`;
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

// Bind language selector and initialize
const langSelector = document.getElementById('lang-selector');
if (langSelector) {
    langSelector.value = currentLang;
    langSelector.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
}
setLanguage(currentLang);

initApp();
