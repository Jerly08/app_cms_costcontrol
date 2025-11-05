// API Base URL
const API_BASE_URL = window.location.origin + '/api/v1';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');

// Check if already logged in
if (localStorage.getItem('access_token')) {
    window.location.href = '/dashboard.html';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens in localStorage
            localStorage.setItem('access_token', data.data.access_token);
            localStorage.setItem('refresh_token', data.data.refresh_token);
            
            // Store user info
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            // Show error message
            showError(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again later.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

// Auto-fill functionality for test accounts (optional)
document.querySelectorAll('.test-accounts li').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function() {
        const text = this.textContent;
        const match = text.match(/([\w.@]+)\s*\/\s*(\w+)/);
        if (match) {
            emailInput.value = match[1];
            passwordInput.value = match[2];
            emailInput.focus();
        }
    });
});

