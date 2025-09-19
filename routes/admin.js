const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'library.db');
const db = new sqlite3.Database(dbPath);

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get all transactions (admin only)
router.get('/admin/transactions', requireAdmin, (req, res) => {
    const query = `
        SELECT 
            t.id,
            t.borrow_date,
            t.due_date,
            t.return_date,
            t.status,
            u.username,
            u.email,
            b.title,
            b.author,
            CASE 
                WHEN date(t.due_date) < date('now') AND t.status = 'active' THEN 'overdue'
                ELSE t.status 
            END as current_status
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN books b ON t.book_id = b.id
        ORDER BY t.borrow_date DESC
    `;

    db.all(query, [], (err, transactions) => {
        if (err) {
            console.error('Error fetching transactions:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(transactions);
    });
});

// Get library statistics (admin only)
router.get('/admin/stats', requireAdmin, (req, res) => {
    const queries = {
        totalBooks: `SELECT COUNT(*) as count FROM books`,
        totalUsers: `SELECT COUNT(*) as count FROM users WHERE role = 'student'`,
        activeLoans: `SELECT COUNT(*) as count FROM transactions WHERE status = 'active'`,
        overdueBooks: `
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE status = 'active' AND date(due_date) < date('now')
        `,
        popularBooks: `
            SELECT b.title, b.author, COUNT(t.id) as borrow_count
            FROM books b
            LEFT JOIN transactions t ON b.id = t.book_id
            GROUP BY b.id, b.title, b.author
            ORDER BY borrow_count DESC
            LIMIT 5
        `
    };

    const stats = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        if (key === 'popularBooks') {
            db.all(query, [], (err, results) => {
                if (err) {
                    console.error(`Error in ${key} query:`, err);
                    stats[key] = key === 'popularBooks' ? [] : 0;
                } else {
                    stats[key] = results;
                }
                completed++;
                if (completed === totalQueries) {
                    res.json(stats);
                }
            });
        } else {
            db.get(query, [], (err, result) => {
                if (err) {
                    console.error(`Error in ${key} query:`, err);
                    stats[key] = 0;
                } else {
                    stats[key] = result.count;
                }
                completed++;
                if (completed === totalQueries) {
                    res.json(stats);
                }
            });
        }
    });
});

// Get overdue books (admin only)
router.get('/admin/overdue', requireAdmin, (req, res) => {
    const query = `
        SELECT 
            t.id,
            t.borrow_date,
            t.due_date,
            u.username,
            u.email,
            b.title,
            b.author,
            julianday('now') - julianday(t.due_date) as days_overdue
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN books b ON t.book_id = b.id
        WHERE t.status = 'active' AND date(t.due_date) < date('now')
        ORDER BY days_overdue DESC
    `;

    db.all(query, [], (err, overdueBooks) => {
        if (err) {
            console.error('Error fetching overdue books:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(overdueBooks);
    });
});

// Add new book (admin only)
router.post('/admin/books', requireAdmin, (req, res) => {
    const { title, author, genre, isbn, coverImage, totalCopies } = req.body;

    if (!title || !author || !genre) {
        return res.status(400).json({ error: 'Title, author, and genre are required' });
    }

    const copies = parseInt(totalCopies) || 1;
    const stmt = `
        INSERT INTO books (title, author, genre, isbn, cover_image, total_copies, available_copies, available)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;

    db.run(stmt, [title, author, genre, isbn || null, coverImage || null, copies, copies], function(err) {
        if (err) {
            console.error('Error adding book:', err);
            return res.status(500).json({ error: 'Failed to add book' });
        }

        res.json({
            message: 'Book added successfully',
            bookId: this.lastID,
            book: {
                id: this.lastID,
                title,
                author,
                genre,
                isbn,
                cover_image: coverImage,
                total_copies: copies,
                available_copies: copies,
                available: true
            }
        });
    });
});

// Return book on behalf of user (admin only)
router.post('/admin/return', requireAdmin, (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Find the transaction
    const findTransaction = `
        SELECT t.*, b.title, u.username 
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ? AND t.status = 'active'
    `;

    db.get(findTransaction, [transactionId], (err, transaction) => {
        if (err) {
            console.error('Error finding transaction:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found or already returned' });
        }

        const returnDate = new Date();

        // Update transaction
        const updateTransaction = `
            UPDATE transactions 
            SET return_date = ?, status = 'returned'
            WHERE id = ?
        `;

        db.run(updateTransaction, [returnDate.toISOString(), transactionId], (err) => {
            if (err) {
                console.error('Error updating transaction:', err);
                return res.status(500).json({ error: 'Failed to update transaction' });
            }

            // Update book availability
            const updateBook = `
                UPDATE books 
                SET available_copies = available_copies + 1,
                    available = 1
                WHERE id = ?
            `;

            db.run(updateBook, [transaction.book_id], (err) => {
                if (err) {
                    console.error('Error updating book availability:', err);
                    return res.status(500).json({ error: 'Failed to update book availability' });
                }

                res.json({
                    message: 'Book returned successfully',
                    bookTitle: transaction.title,
                    username: transaction.username
                });
            });
        });
    });
});
module.exports = router;