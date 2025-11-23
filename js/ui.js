// UI Helper Functions

export const DOM = {
    // Screens
    selectionScreen: () => document.getElementById('selection-screen'),
    resultScreen: () => document.getElementById('result-screen'),
    logScreen: () => document.getElementById('log-screen'),
    adminPanel: () => document.getElementById('admin-panel'),
    
    // Buttons
    submitBtn: () => document.getElementById('submit-btn'),
    testEnvToggle: () => document.getElementById('test-env-toggle'),
    adminToggle: () => document.getElementById('admin-toggle'),
    
    // Modals
    customAlertModal: () => document.getElementById('custom-alert-modal'),
    securityModal: () => document.getElementById('security-modal'),
    adminModal: () => document.getElementById('admin-modal'),
    
    // Other elements
    modeIndicator: () => document.getElementById('mode-indicator'),
    brotherCards: () => document.querySelectorAll('.brother-card'),
    pageTitle: () => document.getElementById('page-title')
};

export function showCustomAlert(icon, title, message, imageSrc = null) {
    const modal = DOM.customAlertModal();
    const iconEl = document.getElementById('alert-icon');
    const imageEl = document.getElementById('alert-image');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    
    iconEl.textContent = icon;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Show or hide image
    if (imageSrc) {
        imageEl.src = imageSrc;
        imageEl.classList.remove('hidden');
    } else {
        imageEl.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

export function closeCustomAlert() {
    DOM.customAlertModal().classList.add('hidden');
}

export function showScreen(screen) {
    // Hide all screens
    DOM.selectionScreen().classList.add('hidden');
    DOM.resultScreen().classList.add('hidden');
    DOM.logScreen().classList.add('hidden');
    DOM.adminPanel().classList.add('hidden');
    
    // Show requested screen
    screen.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function updateModeIndicator(isTestMode) {
    const indicator = DOM.modeIndicator();
    const toggle = DOM.testEnvToggle();
    
    if (isTestMode) {
        toggle.classList.add('active');
        toggle.querySelector('.env-label').textContent = '✓ Go to Production';
        indicator.querySelector('.mode-text').textContent = 'Test Mode';
        indicator.classList.add('test-mode');
    } else {
        toggle.classList.remove('active');
        toggle.querySelector('.env-label').textContent = '🧪 Test Environment';
        indicator.querySelector('.mode-text').textContent = 'Production Mode';
        indicator.classList.remove('test-mode');
    }
}
