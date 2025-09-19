const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'library.db');
const db = new sqlite3.Database(dbPath);

// Get all books with optional filtering
router.get('/books', (req, res) => {
    const { search, genre } = req.query;
    let query = `SELECT * FROM books`;
    let params = [];

    if (search || genre) {
        query += ' WHERE ';
        const conditions = [];

        if (search) {
            conditions.push('(title LIKE ? OR author LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (genre && genre !== 'All') {
            conditions.push('genre = ?');
            params.push(genre);
        }

        query += conditions.join(' AND ');
    }

    query += ' ORDER BY title';

    db.all(query, params, (err, books) => {
        if (err) {
            console.error('Error fetching books:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(books);
    });
});

// Get unique genres
router.get('/genres', (req, res) => {
    const query = `SELECT DISTINCT genre FROM books ORDER BY genre`;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        const genres = rows.map(row => row.genre);
        res.json(genres);
    });
});

// Get single book by ID
router.get('/books/:id', (req, res) => {
    const bookId = req.params.id;
    const query = `SELECT * FROM books WHERE id = ?`;

    db.get(query, [bookId], (err, book) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book);
    });
});

module.exports = router;