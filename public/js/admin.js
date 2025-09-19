// Admin dashboard functionality

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadAdminDashboard();
    setupAddBookForm();
});

// Load admin dashboard data
async function loadAdminDashboard() {
    try {
        // Check authentication and admin role
        const sessionResponse = await fetch('/api/session');
        if (!sessionResponse.ok) {
            window.location.href = '/login';
            return;
        }
        
        const sessionData = await sessionResponse.json();
        if (sessionData.user.role !== 'admin') {
            window.location.href = '/dashboard';
            return;
        }
        
        currentAdmin = sessionData.user;
        updateAdminWelcome();
        
        // Load all admin data in parallel
        await Promise.all([
            loadStatistics(),
            loadAllTransactions(),
            loadOverdueBooks()
        ]);
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showMessage('Error loading admin dashboard', 'danger');
    }
}

// Update admin welcome message
function updateAdminWelcome() {
    const welcomeElement = document.getElementById('userWelcome');
    if (welcomeElement && currentAdmin) {
        welcomeElement.textContent = `Admin: ${currentAdmin.username}`;
    }
}

// Load library statistics
async function loadStatistics() {
    const loadingElement = document.getElementById('statsLoading');
    const contentElement = document.getElementById('statsContent');
    
    try {
        const response = await fetch('/api/admin/stats');
        
        if (response.ok) {
            const stats = await response.json();
            
            loadingElement.style.display = 'none';
            displayStatistics(stats);
            contentElement.style.display = 'grid';
        } else {
            throw new Error('Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        loadingElement.innerHTML = `
            <div class="alert alert-danger">
                Error loading statistics. <a href="#" onclick="loadStatistics()">Try again</a>
            </div>
        `;
    }
}

// Display statistics cards
function displayStatistics(stats) {
    const contentElement = document.getElementById('statsContent');
    
    const html = `
        <div class="stat-card">
            <div class="stat-number tooltip" data-tooltip="Total books in library">${stats.totalBooks || 0}</div>
            <div class="stat-label">Total Books</div>
        </div>
        <div class="stat-card">
            <div class="stat-number tooltip" data-tooltip="Registered students and staff">${stats.totalUsers || 0}</div>
            <div class="stat-label">Registered Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number tooltip" style="color: var(--warning-color);" data-tooltip="Currently borrowed books">${stats.activeLoans || 0}</div>
            <div class="stat-label">Active Loans</div>
        </div>
        <div class="stat-card">
            <div class="stat-number tooltip" style="color: var(--accent-color);" data-tooltip="Books past due date">${stats.overdueBooks || 0}</div>
            <div class="stat-label">Overdue Books</div>
        </div>
    `;
    
    // Add popular books section if available
    if (stats.popularBooks && stats.popularBooks.length > 0) {
        const popularBooksHtml = `
            <div class="card" style="grid-column: 1 / -1; margin-top: 1rem;">
                <div class="card-header">
                    <h3 style="margin: 0; color: var(--text-primary);">📈 Most Popular Books</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${stats.popularBooks.map((book, index) => `
                            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-light); border-radius: 8px;">
                                <span style="font-weight: bold; color: var(--primary-color);">#${index + 1}</span>
                                <div>
                                    <div style="font-weight: 600;">${book.title}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">by ${book.author}</div>
                                    <div style="font-size: 0.8rem; color: var(--success-color);">
                                        ${book.borrow_count} borrow${book.borrow_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        contentElement.innerHTML = html + popularBooksHtml;
    } else {
        contentElement.innerHTML = html;
    }
}

// Load all transactions
async function loadAllTransactions() {
    const loadingElement = document.getElementById('transactionsLoading');
    const contentElement = document.getElementById('transactionsContent');
    
    try {
        const response = await fetch('/api/admin/transactions');
        
        if (response.ok) {
            const transactions = await response.json();
            
            loadingElement.style.display = 'none';
            displayTransactions(transactions);
            contentElement.style.display = 'block';
        } else {
            throw new Error('Failed to load transactions');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        loadingElement.innerHTML = `
            <div class="alert alert-danger">
                Error loading transactions. <a href="#" onclick="loadAllTransactions()">Try again</a>
            </div>
        `;
    }
}

// Display all transactions
function displayTransactions(transactions) {
    const contentElement = document.getElementById('transactionsContent');
    
    if (transactions.length === 0) {
        contentElement.innerHTML = `
            <div class="text-center" style="padding: 2rem; color: var(--text-secondary);">
                <h3>No transactions found</h3>
                <p>No books have been borrowed yet.</p>
            </div>
        `;
        return;
    }
    
    // Sort transactions by borrow date (newest first)
    transactions.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date));
    
    const html = `
        <div class="table">
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Book</th>
                        <th>Author</th>
                        <th>Borrowed Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(transaction => `
                        <tr>
                            <td><strong>${transaction.username}</strong></td>
                            <td>${transaction.email}</td>
                            <td>${transaction.title}</td>
                            <td>${transaction.author}</td>
                            <td>${formatDate(transaction.borrow_date)}</td>
                            <td style="color: ${transaction.current_status === 'overdue' ? 'var(--accent-color)' : 'var(--text-primary)'}">
                                ${formatDate(transaction.due_date)}
                            </td>
                            <td>
                                ${transaction.return_date ? formatDate(transaction.return_date) : 
                                  '<span style="color: var(--warning-color);">Not returned</span>'}
                            </td>
                            <td>
                                <span class="status-badge ${getTransactionStatusClass(transaction)}">
                                    ${getTransactionStatusText(transaction)}
                                </span>
                            </td>
                            <td>
                                ${transaction.status === 'active' ? 
                                    `<button class="btn btn-small btn-success" 
                                             onclick="adminReturnBook(${transaction.id}, '${transaction.title.replace(/'/g, "\\'")}', '${transaction.username}')">
                                        Return Book
                                     </button>` : 
                                    '<span style="color: var(--text-secondary);">-</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
            <strong>Total Transactions:</strong> ${transactions.length}
        </div>
    `;
    
    contentElement.innerHTML = html;
}

// Load overdue books
async function loadOverdueBooks() {
    const loadingElement = document.getElementById('overdueLoading');
    const contentElement = document.getElementById('overdueContent');
    const noOverdueElement = document.getElementById('noOverdueMessage');
    
    try {
        const response = await fetch('/api/admin/overdue');
        
        if (response.ok) {
            const overdueBooks = await response.json();
            
            loadingElement.style.display = 'none';
            
            if (overdueBooks.length === 0) {
                noOverdueElement.style.display = 'block';
            } else {
                displayOverdueBooks(overdueBooks);
                contentElement.style.display = 'block';
            }
        } else {
            throw new Error('Failed to load overdue books');
        }
    } catch (error) {
        console.error('Error loading overdue books:', error);
        loadingElement.innerHTML = `
            <div class="alert alert-danger">
                Error loading overdue books. <a href="#" onclick="loadOverdueBooks()">Try again</a>
            </div>
        `;
    }
}

// Display overdue books
function displayOverdueBooks(overdueBooks) {
    const contentElement = document.getElementById('overdueContent');
    
    // Sort by days overdue (most overdue first)
    overdueBooks.sort((a, b) => b.days_overdue - a.days_overdue);
    
    const html = `
        <div class="alert alert-warning mb-3">
            <strong>⚠️ ${overdueBooks.length} book(s) are currently overdue!</strong>
            These users should be contacted to return their books.
        </div>
        
        <div class="table">
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Book</th>
                        <th>Author</th>
                        <th>Due Date</th>
                        <th>Days Overdue</th>
                        <th>Borrowed Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${overdueBooks.map(book => `
                        <tr style="background-color: rgba(220, 38, 38, 0.05);">
                            <td><strong>${book.username}</strong></td>
                            <td>
                                <a href="mailto:${book.email}" style="color: var(--primary-color);">
                                    ${book.email}
                                </a>
                            </td>
                            <td><strong>${book.title}</strong></td>
                            <td>${book.author}</td>
                            <td style="color: var(--accent-color);">
                                <strong>${formatDate(book.due_date)}</strong>
                            </td>
                            <td>
                                <span style="color: var(--accent-color); font-weight: bold;">
                                    ${Math.floor(book.days_overdue)} day(s)
                                </span>
                            </td>
                            <td>${formatDate(book.borrow_date)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    contentElement.innerHTML = html;
}

// Setup add book form
function setupAddBookForm() {
    const form = document.getElementById('addBookForm');
    if (form) {
        form.addEventListener('submit', handleAddBook);
    }
}

// Handle add book form submission
async function handleAddBook(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const genre = document.getElementById('bookGenre').value;
    const isbn = document.getElementById('bookISBN').value.trim();
    const coverImage = document.getElementById('bookCoverImage').value.trim();
    const totalCopies = document.getElementById('totalCopies').value;
    
    const addBookBtn = document.getElementById('addBookBtn');
    
    // Validation
    if (!title || !author || !genre) {
        showMessage('Please fill in all required fields', 'danger');
        return;
    }
    
    // Show loading state
    addBookBtn.disabled = true;
    addBookBtn.textContent = 'Adding Book...';
    
    try {
        const response = await fetch('/api/admin/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                author,
                genre,
                isbn: isbn || null,
                coverImage: coverImage || null,
                totalCopies: parseInt(totalCopies) || 1
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`"${title}" has been added to the library successfully!`, 'success');
            
            // Reset form
            document.getElementById('addBookForm').reset();
            
            // Reload statistics to reflect the new book
            await loadStatistics();
        } else {
            showMessage(data.error || 'Failed to add book', 'danger');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showMessage('Network error. Please try again.', 'danger');
    } finally {
        // Reset button state
        addBookBtn.disabled = false;
        addBookBtn.textContent = 'Add Book to Library';
    }
}

// Return book on behalf of user
async function adminReturnBook(transactionId, bookTitle, username) {
    if (!confirm(`Are you sure you want to return "${bookTitle}" for ${username}?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/return', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactionId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`"${bookTitle}" returned successfully for ${username}`, 'success');
            
            // Reload all data to reflect changes
            await Promise.all([
                loadStatistics(),
                loadAllTransactions(),
                loadOverdueBooks()
            ]);
        } else {
            showMessage(data.error || 'Failed to return book', 'danger');
        }
    } catch (error) {
        console.error('Error returning book:', error);
        showMessage('Network error. Please try again.', 'danger');
    }
}

// Helper function to get transaction status class
function getTransactionStatusClass(transaction) {
    if (transaction.current_status === 'overdue') return 'status-unavailable';
    if (transaction.status === 'returned') return 'status-available';
    return 'status-available';
}

// Helper function to get transaction status text
function getTransactionStatusText(transaction) {
    if (transaction.current_status === 'overdue') return 'Overdue';
    if (transaction.status === 'returned') {
        const wasOverdue = transaction.return_date && 
            new Date(transaction.return_date) > new Date(transaction.due_date);
        return wasOverdue ? 'Returned Late' : 'Returned On Time';
    }
    if (transaction.status === 'active') return 'Currently Borrowed';
    return transaction.status;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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