const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'library.db');
const db = new sqlite3.Database(dbPath);

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Borrow a book
router.post('/borrow', requireAuth, (req, res) => {
    const { bookId } = req.body;
    const userId = req.session.userId;

    // First, check if user already has 3 books borrowed
    const checkUserBooks = `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE user_id = ? AND status = 'active'
    `;

    db.get(checkUserBooks, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.count >= 3) {
            return res.status(400).json({ error: 'Maximum borrowing limit reached (3 books)' });
        }

        // Check if book is available
        const checkBook = `SELECT * FROM books WHERE id = ? AND available_copies > 0`;

        db.get(checkBook, [bookId], (err, book) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!book) {
                return res.status(400).json({ error: 'Book not available for borrowing' });
            }

            // Check if user already has this book borrowed
            const checkExisting = `
                SELECT * FROM transactions 
                WHERE user_id = ? AND book_id = ? AND status = 'active'
            `;

            db.get(checkExisting, [userId, bookId], (err, existing) => {
                if (err) {
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (existing) {
                    return res.status(400).json({ error: 'You have already borrowed this book' });
                }

                // Create transaction and update book availability
                const borrowDate = new Date();
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7); // 7 days loan period

                const insertTransaction = `
                    INSERT INTO transactions (user_id, book_id, borrow_date, due_date, status)
                    VALUES (?, ?, ?, ?, 'active')
                `;

                db.run(insertTransaction, [userId, bookId, borrowDate.toISOString(), dueDate.toISOString()], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create transaction' });
                    }

                    // Update book availability
                    const updateBook = `
                        UPDATE books 
                        SET available_copies = available_copies - 1,
                            available = CASE WHEN available_copies - 1 > 0 THEN 1 ELSE 0 END
                        WHERE id = ?
                    `;

                    db.run(updateBook, [bookId], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to update book availability' });
                        }

                        res.json({
                            message: 'Book borrowed successfully',
                            transactionId: this.lastID,
                            dueDate: dueDate.toISOString()
                        });
                    });
                });
            });
        });
    });
});

// Return a book
router.post('/return', requireAuth, (req, res) => {
    const { transactionId } = req.body;
    const userId = req.session.userId;

    // Find the transaction
    const findTransaction = `
        SELECT t.*, b.title 
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        WHERE t.id = ? AND t.user_id = ? AND t.status = 'active'
    `;

    db.get(findTransaction, [transactionId, userId], (err, transaction) => {
        if (err) {
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
                    return res.status(500).json({ error: 'Failed to update book availability' });
                }

                res.json({
                    message: 'Book returned successfully',
                    bookTitle: transaction.title
                });
            });
        });
    });
});

// Get user's current borrowed books
router.get('/my-books', requireAuth, (req, res) => {
    const userId = req.session.userId;

    const query = `
        SELECT 
            t.id as transaction_id,
            t.borrow_date,
            t.due_date,
            t.status,
            b.id as book_id,
            b.title,
            b.author,
            b.cover_image,
            CASE 
                WHEN date(t.due_date) < date('now') AND t.status = 'active' THEN 'overdue'
                ELSE t.status 
            END as current_status
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        WHERE t.user_id = ? AND t.status = 'active'
        ORDER BY t.due_date ASC
    `;

    db.all(query, [userId], (err, books) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(books);
    });
});

// Get user's borrowing history
router.get('/history', requireAuth, (req, res) => {
    const userId = req.session.userId;

    const query = `
        SELECT 
            t.id as transaction_id,
            t.borrow_date,
            t.due_date,
            t.return_date,
            t.status,
            b.title,
            b.author,
            b.cover_image
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        WHERE t.user_id = ?
        ORDER BY t.borrow_date DESC
    `;

    db.all(query, [userId], (err, history) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(history);
    });
});

module.exports = router;