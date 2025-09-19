// Main JavaScript functionality

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    initMobileMenu();
});

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/session');
        
        if (response.ok) {
            const data = await response.json();
            updateNavForLoggedInUser(data.user);
            
            // Redirect to appropriate dashboard if on login/signup pages
            const currentPage = window.location.pathname;
            if (currentPage === '/login' || currentPage === '/signup') {
                if (data.user.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            }
            
            // Protect admin pages
            if (currentPage === '/admin' && data.user.role !== 'admin') {
                window.location.href = '/dashboard';
            }
        } else {
            updateNavForGuestUser();
            
            // Redirect to login if trying to access protected pages
            const protectedPages = ['/dashboard', '/admin'];
            const currentPage = window.location.pathname;
            if (protectedPages.includes(currentPage)) {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        updateNavForGuestUser();
    }
}

// Update navigation for logged-in users
function updateNavForLoggedInUser(user) {
    const navAuth = document.getElementById('navAuth');
    const navLinks = document.getElementById('navLinks');
    
    if (navAuth) {
        navAuth.innerHTML = `
            <div class="user-info">
                <span>Welcome, ${user.username}!</span>
                <button class="btn btn-small btn-secondary" onclick="logout()">Logout</button>
            </div>
        `;
    }
    
    // Add appropriate dashboard link to navigation
    if (navLinks && !navLinks.innerHTML.includes('Dashboard')) {
        const dashboardLink = user.role === 'admin' 
            ? '<li><a href="/admin">Admin Dashboard</a></li>'
            : '<li><a href="/dashboard">My Dashboard</a></li>';
        
        navLinks.insertAdjacentHTML('beforeend', dashboardLink);
    }
}

// Update navigation for guest users
function updateNavForGuestUser() {
    const navAuth = document.getElementById('navAuth');
    
    if (navAuth) {
        navAuth.innerHTML = `
            <a href="/login" class="btn btn-secondary">Login</a>
            <a href="/signup" class="btn btn-primary">Sign Up</a>
        `;
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showMessage('Logged out successfully', 'success');
            window.location.href = '/';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error during logout', 'danger');
    }
}

// Show success/error messages
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        margin-bottom: 1rem;
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease-out;
    `;
    alertDiv.textContent = message;
    
    messageContainer.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }
    }, 5000);
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav')) {
                navLinks.classList.remove('active');
            }
        });
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Utility function to check if a date is overdue
function isOverdue(dueDateString) {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);