const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Create database file path
const dbPath = path.join(__dirname, 'library.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Create tables
const createTables = () => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('student', 'admin')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating users table:', err.message);
        else console.log('Users table created successfully.');
    });

    // Books table
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            genre TEXT NOT NULL,
            cover_image TEXT,
            isbn TEXT,
            available BOOLEAN DEFAULT 1,
            total_copies INTEGER DEFAULT 1,
            available_copies INTEGER DEFAULT 1
        )
    `, (err) => {
        if (err) console.error('Error creating books table:', err.message);
        else console.log('Books table created successfully.');
    });

    // Transactions table
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            due_date DATETIME NOT NULL,
            return_date DATETIME NULL,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue')),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (book_id) REFERENCES books (id)
        )
    `, (err) => {
        if (err) console.error('Error creating transactions table:', err.message);
        else console.log('Transactions table created successfully.');
    });
};

// Insert sample data
const insertSampleData = () => {
    // Hash passwords
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const studentPassword = bcrypt.hashSync('student123', 10);

    // Insert sample users
    db.run(`
        INSERT OR IGNORE INTO users (username, email, password_hash, role)
        VALUES 
            ('admin', 'admin@venda.ac.za', ?, 'admin'),
            ('student1', 'student1@venda.ac.za', ?, 'student'),
            ('student2', 'student2@venda.ac.za', ?, 'student')
    `, [adminPassword, studentPassword, studentPassword], (err) => {
        if (err) console.error('Error inserting users:', err.message);
        else console.log('Sample users inserted successfully.');
    });

    // Insert sample books
    const books = [
        ['Introduction to Computer Science', 'John Smith', 'Computer Science', 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg', '978-0123456789'],
        ['Advanced JavaScript', 'Jane Doe', 'Computer Science', 'https://images.pexels.com/photos/1181233/pexels-photo-1181233.jpeg', '978-0987654321'],
        ['Physics Fundamentals', 'Albert Einstein', 'Physics', 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg', '978-0111222333'],
        ['Artificial Intelligence Basics', 'Alan Turing', 'AI', 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg', '978-0444555666'],
        ['Database Systems', 'Edgar Codd', 'Computer Science', 'https://images.pexels.com/photos/159621/open-book-library-education-read-159621.jpeg', '978-0777888999'],
        ['Quantum Mechanics', 'Max Planck', 'Physics', 'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg', '978-0333444555'],
        ['Machine Learning Introduction', 'Geoffrey Hinton', 'AI', 'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg', '978-0666777888'],
        ['Web Development Mastery', 'Tim Berners-Lee', 'Computer Science', 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg', '978-0999000111'],
        ['Mathematics for Engineers', 'Isaac Newton', 'Mathematics', 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg', '978-0222333444'],
        ['Data Structures and Algorithms', 'Donald Knuth', 'Computer Science', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg', '978-0555666777']
    ];

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO books (title, author, genre, cover_image, isbn)
        VALUES (?, ?, ?, ?, ?)
    `);

    books.forEach(book => {
        stmt.run(book, (err) => {
            if (err) console.error('Error inserting book:', err.message);
        });
    });

    stmt.finalize();
    console.log('Sample books inserted successfully.');
};

// Initialize database
createTables();
setTimeout(insertSampleData, 1000);

// Close database connection
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
            console.log('\nDatabase initialization completed!');
            console.log('Sample credentials:');
            console.log('Admin: admin@venda.ac.za / admin123');
            console.log('Student: student1@venda.ac.za / student123');
        }
    });
}, 2000);