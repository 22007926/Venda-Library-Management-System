// Dashboard functionality

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserDashboard();
});

// Load user dashboard data
async function loadUserDashboard() {
    try {
        // Check authentication
        const sessionResponse = await fetch('/api/session');
        if (!sessionResponse.ok) {
            window.location.href = '/login';
            return;
        }
        
        currentUser = (await sessionResponse.json()).user;
        updateDashboardTitle();
        
        // Load current borrowed books and history in parallel
        await Promise.all([
            loadCurrentBooks(),
            loadBorrowingHistory()
        ]);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showMessage('Error loading dashboard data', 'danger');
    }
}

// Update dashboard title with user's name
function updateDashboardTitle() {
    const titleElement = document.getElementById('dashboardTitle');
    const welcomeElement = document.getElementById('userWelcome');
    
    if (titleElement && currentUser) {
        titleElement.textContent = `${currentUser.username}'s Library Dashboard`;
    }
    
    if (welcomeElement && currentUser) {
        welcomeElement.textContent = `Welcome, ${currentUser.username}!`;
    }
}

// Load currently borrowed books
async function loadCurrentBooks() {
    const loadingElement = document.getElementById('currentBooksLoading');
    const contentElement = document.getElementById('currentBooksContent');
    const noBooksElement = document.getElementById('noBooksMessage');
    
    try {
        const response = await fetch('/api/my-books');
        
        if (response.ok) {
            const books = await response.json();
            
            loadingElement.style.display = 'none';
            
            if (books.length === 0) {
                noBooksElement.style.display = 'block';
            } else {
                displayCurrentBooks(books);
                contentElement.style.display = 'block';
            }
        } else {
            throw new Error('Failed to load books');
        }
    } catch (error) {
        console.error('Error loading current books:', error);
        loadingElement.innerHTML = `
            <div class="alert alert-danger">
                Error loading borrowed books. <a href="#" onclick="loadCurrentBooks()">Try again</a>
            </div>
        `;
    }
}

// Display currently borrowed books
function displayCurrentBooks(books) {
    const contentElement = document.getElementById('currentBooksContent');
    
    // Separate overdue and regular books
    const overdueBooks = books.filter(book => isOverdue(book.due_date));
    const regularBooks = books.filter(book => !isOverdue(book.due_date));
    const dueSoonBooks = books.filter(book => isDueSoon(book.due_date) && !isOverdue(book.due_date));
    
    let html = '';
    
    // Show overdue books first if any
    if (overdueBooks.length > 0) {
        html += `
            <div class="alert alert-danger mb-3">
                <strong>⚠️ You have ${overdueBooks.length} overdue book(s)!</strong>
                Please return them as soon as possible.
            </div>
        `;
    }
    
    // Show due soon warning
    if (dueSoonBooks.length > 0) {
        html += `
            <div class="alert alert-warning mb-3">
                <strong>📅 ${dueSoonBooks.length} book(s) due within 2 days!</strong>
                Consider renewing or returning them soon.
            </div>
        `;
    }
    
    // Add quick stats
    html += `
        <div class="quick-stats">
            <div class="quick-stat">
                <strong>${books.length}</strong> books borrowed
            </div>
            <div class="quick-stat">
                <strong>${3 - books.length}</strong> slots remaining
            </div>
            ${overdueBooks.length > 0 ? `<div class="quick-stat" style="color: var(--accent-color);"><strong>${overdueBooks.length}</strong> overdue</div>` : ''}
        </div>
    `;
    
    // Display all books in a table
    html += `
        <div class="table" style="overflow-x: auto;">
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Book</th>
                        <th>Author</th>
                        <th>Borrowed Date</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.map(book => `
                        <tr ${isOverdue(book.due_date) ? 'class="due-today"' : isDueSoon(book.due_date) ? 'class="due-soon"' : ''}>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <img src="${book.cover_image}" alt="${book.title}" 
                                         style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;">
                                    <strong>${book.title}</strong>
                                </div>
                            </td>
                            <td>${book.author}</td>
                            <td>${formatDate(book.borrow_date)}</td>
                            <td style="color: ${isOverdue(book.due_date) ? 'var(--accent-color)' : 'var(--text-primary)'}">
                                ${formatDate(book.due_date)}
                                ${isOverdue(book.due_date) ? '<br><small>OVERDUE</small>' : isDueSoon(book.due_date) ? '<br><small>DUE SOON</small>' : ''}
                                <div class="progress-bar" style="margin-top: 0.25rem;">
                                    <div class="progress-fill" style="width: ${getDueDateProgress(book.due_date)}%"></div>
                                </div>
                            </td>
                            <td>
                                <span class="status-indicator">
                                    <span class="status-dot ${isOverdue(book.due_date) ? 'unavailable' : isDueSoon(book.due_date) ? 'due-soon' : 'available'}"></span>
                                    ${isOverdue(book.due_date) ? 'Overdue' : isDueSoon(book.due_date) ? 'Due Soon' : 'Active'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-small btn-success tooltip" 
                                        data-tooltip="Return this book"
                                        onclick="returnBook(${book.transaction_id}, '${book.title}')">
                                    Return Book
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    contentElement.innerHTML = html;
}

// Return a book
async function returnBook(transactionId, bookTitle) {
    try {
        const response = await fetch('/api/return', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactionId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`"${bookTitle}" returned successfully!`, 'success');
            // Reload current books and history
            await Promise.all([
                loadCurrentBooks(),
                loadBorrowingHistory()
            ]);
        } else {
            showMessage(data.error || 'Failed to return book', 'danger');
        }
    } catch (error) {
        console.error('Error returning book:', error);
        showMessage('Network error. Please try again.', 'danger');
    }
}

// Load borrowing history
async function loadBorrowingHistory() {
    const loadingElement = document.getElementById('historyLoading');
    const contentElement = document.getElementById('historyContent');
    const noHistoryElement = document.getElementById('noHistoryMessage');
    
    try {
        const response = await fetch('/api/history');
        
        if (response.ok) {
            const history = await response.json();
            
            loadingElement.style.display = 'none';
            
            if (history.length === 0) {
                noHistoryElement.style.display = 'block';
            } else {
                displayBorrowingHistory(history);
                contentElement.style.display = 'block';
            }
        } else {
            throw new Error('Failed to load history');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        loadingElement.innerHTML = `
            <div class="alert alert-danger">
                Error loading borrowing history. <a href="#" onclick="loadBorrowingHistory()">Try again</a>
            </div>
        `;
    }
}

// Display borrowing history
function displayBorrowingHistory(history) {
    const contentElement = document.getElementById('historyContent');
    
    const html = `
        <div class="table" style="overflow-x: auto;">
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Book</th>
                        <th>Author</th>
                        <th>Borrowed Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(record => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <img src="${record.cover_image}" alt="${record.title}" 
                                         style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;">
                                    <strong>${record.title}</strong>
                                </div>
                            </td>
                            <td>${record.author}</td>
                            <td>${formatDate(record.borrow_date)}</td>
                            <td>${formatDate(record.due_date)}</td>
                            <td>
                                ${record.return_date ? formatDate(record.return_date) : 
                                  '<span style="color: var(--warning-color);">Not returned</span>'}
                            </td>
                            <td>
                                <span class="status-badge ${getHistoryStatusClass(record)}">
                                    ${getHistoryStatusText(record)}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    contentElement.innerHTML = html;
}

// Get status class for history records
function getHistoryStatusClass(record) {
    if (record.status === 'returned') return 'status-available';
    if (record.status === 'active' && isOverdue(record.due_date)) return 'status-unavailable';
    return 'status-available';
}

// Get status text for history records
function getHistoryStatusText(record) {
    if (record.status === 'returned') {
        const wasOverdue = record.return_date && isOverdue(record.due_date) && 
                          new Date(record.return_date) > new Date(record.due_date);
        return wasOverdue ? 'Returned Late' : 'Returned On Time';
    }
    if (record.status === 'active') {
        return isOverdue(record.due_date) ? 'Overdue' : 'Currently Borrowed';
    }
    return record.status;
}

// Utility functions (can be moved to main.js if needed)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function isOverdue(dueDateString) {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function isDueSoon(dueDateString) {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);
    
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    twoDaysFromNow.setHours(0, 0, 0, 0);
    
    return dueDate >= today && dueDate <= twoDaysFromNow;
}

function getDueDateProgress(dueDateString) {
    const borrowDate = new Date();
    borrowDate.setDate(borrowDate.getDate() - 7); // Assume 7-day loan period
    const dueDate = new Date(dueDateString);
    const today = new Date();
    
    const totalDays = 7; // 7-day loan period
    const daysPassed = Math.floor((today - borrowDate) / (1000 * 60 * 60 * 24));
    const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    
    return progress;
}
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