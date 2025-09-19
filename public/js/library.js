// Library page functionality

let allBooks = [];
let filteredBooks = [];
let searchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    loadBooksAndGenres();
    setupSearchAndFilter();
    setupBookPreview();
});

// Load books and genres
async function loadBooksAndGenres() {
    try {
        // Load books and genres in parallel
        const [booksResponse, genresResponse] = await Promise.all([
            fetch('/api/books'),
            fetch('/api/genres')
        ]);
        
        if (booksResponse.ok && genresResponse.ok) {
            allBooks = await booksResponse.json();
            const genres = await genresResponse.json();
            
            populateGenreFilter(genres);
            displayBooks(allBooks);
            updateSearchResultsCount(allBooks.length, allBooks.length);
        } else {
            throw new Error('Failed to load data');
        }
    } catch (error) {
        console.error('Error loading books:', error);
        showError('Failed to load books. Please try again.');
    } finally {
        hideLoading();
    }
}

// Populate genre filter dropdown
function populateGenreFilter(genres) {
    const genreFilter = document.getElementById('genreFilter');
    
    // Clear existing options except "All Genres"
    genreFilter.innerHTML = '<option value="">All Genres</option>';
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}

// Setup search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');
    
    // Debounced search
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterAndDisplayBooks();
        }, 300);
    });
    
    genreFilter.addEventListener('change', filterAndDisplayBooks);
}

// Filter and display books based on search and genre
function filterAndDisplayBooks() {
    searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedGenre = document.getElementById('genreFilter').value;
    
    filteredBooks = allBooks.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm);
            
        const matchesGenre = !selectedGenre || book.genre === selectedGenre;
        
        return matchesSearch && matchesGenre;
    });
    
    updateSearchResultsCount(filteredBooks.length, allBooks.length);
    displayBooks(filteredBooks);
}

// Update search results count
function updateSearchResultsCount(filtered, total) {
    let countElement = document.getElementById('searchResultsCount');
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.id = 'searchResultsCount';
        countElement.className = 'search-results-count';
        
        const booksGrid = document.getElementById('booksGrid');
        booksGrid.parentNode.insertBefore(countElement, booksGrid);
    }
    
    if (searchTerm || document.getElementById('genreFilter').value) {
        countElement.textContent = `Showing ${filtered} of ${total} books`;
        countElement.style.display = 'block';
    } else {
        countElement.style.display = 'none';
    }
}

// Display books in the grid
function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    const noResults = document.getElementById('noResults');
    
    if (books.length === 0) {
        booksGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    booksGrid.style.display = 'grid';
    
    booksGrid.innerHTML = books.map(book => `
        <div class="book-card">
            <div class="book-availability ${book.available ? 'available' : 'unavailable'}" 
                 title="${book.available ? 'Available for borrowing' : 'Currently checked out'}"></div>
            <img src="${book.cover_image || 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg'}" 
                 alt="${book.title}" class="book-image"
                 onerror="this.src='https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg'"
                 onclick="showBookPreview(${book.id})">
            <div class="book-info">
                <h3 class="book-title">${highlightSearchTerm(book.title)}</h3>
                <p class="book-author">by ${highlightSearchTerm(book.author)}</p>
                <span class="book-genre">${book.genre}</span>
                ${book.isbn ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0;">ISBN: ${book.isbn}</p>` : ''}
                <div class="book-status">
                    <span class="status-indicator">
                        <span class="status-dot ${book.available ? 'available' : 'unavailable'}"></span>
                        ${book.available ? 'Available' : 'Checked Out'}
                    </span>
                    ${createActionButton(book)}
                </div>
            </div>
        </div>
    `).join('');
}

// Highlight search terms in text
function highlightSearchTerm(text) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Setup book preview functionality
function setupBookPreview() {
    // Create modal HTML
    const modalHTML = `
        <div id="bookPreviewModal" class="modal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeBookPreview()">&times;</button>
                <div id="bookPreviewContent"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal when clicking outside
    document.getElementById('bookPreviewModal').addEventListener('click', (e) => {
        if (e.target.id === 'bookPreviewModal') {
            closeBookPreview();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBookPreview();
        }
    });
}

// Show book preview modal
async function showBookPreview(bookId) {
    try {
        const response = await fetch(`/api/books/${bookId}`);
        if (response.ok) {
            const book = await response.json();
            displayBookPreview(book);
        }
    } catch (error) {
        console.error('Error loading book details:', error);
    }
}

// Display book preview
function displayBookPreview(book) {
    const content = document.getElementById('bookPreviewContent');
    content.innerHTML = `
        <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem;">
            <img src="${book.cover_image || 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg'}" 
                 alt="${book.title}" 
                 style="width: 120px; height: 160px; object-fit: cover; border-radius: 8px; box-shadow: var(--shadow);">
            <div style="flex: 1;">
                <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">${book.title}</h2>
                <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 1.1rem;">by ${book.author}</p>
                <span class="book-genre" style="margin-bottom: 1rem; display: inline-block;">${book.genre}</span>
                ${book.isbn ? `<p style="margin: 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;"><strong>ISBN:</strong> ${book.isbn}</p>` : ''}
                <div style="margin-top: 1rem;">
                    <span class="status-indicator" style="font-size: 1rem;">
                        <span class="status-dot ${book.available ? 'available' : 'unavailable'}"></span>
                        ${book.available ? 'Available for borrowing' : 'Currently checked out'}
                    </span>
                </div>
            </div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeBookPreview()">Close</button>
            ${book.available ? 
                `<button class="btn btn-primary" onclick="borrowBookFromPreview(${book.id})">Borrow Book</button>` : 
                `<button class="btn btn-secondary" disabled>Not Available</button>`
            }
        </div>
    `;
    
    document.getElementById('bookPreviewModal').classList.add('show');
}

// Close book preview modal
function closeBookPreview() {
    document.getElementById('bookPreviewModal').classList.remove('show');
}

// Borrow book from preview modal
async function borrowBookFromPreview(bookId) {
    await borrowBook(bookId);
    closeBookPreview();
}

// Create action button based on book availability and user auth
function createActionButton(book) {
    if (!book.available) {
        return '<button class="btn btn-small btn-secondary" disabled>Not Available</button>';
    }
    
    // Check if user is logged in (this will be handled by the auth check)
    return `<button class="btn btn-small btn-primary" onclick="borrowBook(${book.id})">Borrow Book</button>`;
}

// Borrow book function
async function borrowBook(bookId) {
    try {
        // Check if user is authenticated
        const sessionResponse = await fetch('/api/session');
        
        if (!sessionResponse.ok) {
            showMessage('Please login to borrow books', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }
        
        const response = await fetch('/api/borrow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bookId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Book borrowed successfully!', 'success');
            // Reload books to update availability
            loadBooksAndGenres();
        } else {
            showMessage(data.error || 'Failed to borrow book', 'danger');
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        showMessage('Network error. Please try again.', 'danger');
    }
}

// Hide loading indicator
function hideLoading() {
    const loading = document.getElementById('loading');
    const booksGrid = document.getElementById('booksGrid');
    
    loading.style.display = 'none';
    booksGrid.style.display = 'grid';
}

// Show error message
function showError(message) {
    const booksGrid = document.getElementById('booksGrid');
    const noResults = document.getElementById('noResults');
    
    booksGrid.style.display = 'none';
    noResults.innerHTML = `
        <h3>Error Loading Books</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
    `;
    noResults.style.display = 'block';
}

// Show message function (reuse from main.js)
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