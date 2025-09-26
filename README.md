# 📚 Venda University Library Management System (VULMS)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-orange.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, web-based library management system designed specifically for Venda University to automate and streamline library operations, replacing manual record-keeping with an efficient digital solution.

## 🌟 Features

### For Students & Staff
- **📖 Digital Book Catalog** - Browse and search through the complete library collection
- **🔍 Advanced Search & Filtering** - Find books by title, author, or genre
- **📱 Responsive Design** - Access from any device (desktop, tablet, mobile)
- **📊 Personal Dashboard** - Track borrowed books, due dates, and borrowing history
- **⚡ One-Click Borrowing** - Borrow available books instantly
- **🔔 Due Date Alerts** - Visual warnings for books due soon or overdue

### For Administrators
- **📈 Comprehensive Analytics** - View library statistics and popular books
- **👥 User Management** - Monitor all user transactions and activities
- **📚 Book Management** - Add new books with cover images and manage inventory
- **⚠️ Overdue Tracking** - Identify and manage overdue books
- **🔄 Administrative Returns** - Return books on behalf of users
- **📊 Real-time Reports** - Access up-to-date library metrics

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/vulms.git
cd vulms

# Install dependencies
npm install

# Initialize the database
npm run init-db

# Start the server
npm start/node server.js
```

Visit `http://localhost:3000` to access VULMS.

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@venda.ac.za | admin123 |
| Student | student1@venda.ac.za | student123 |
| Student | student2@venda.ac.za | student123 |

## 📋 System Requirements

- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Operating System** Windows, macOS, or Linux

## 🏗️ Architecture

```
VULMS/
├── 🎨 Frontend (HTML5, CSS3, Vanilla JS)
│   ├── Responsive UI components
│   ├── Interactive dashboards
│   └── Real-time updates
├── ⚙️ Backend (Node.js + Express.js)
│   ├── RESTful API endpoints
│   ├── Session-based authentication
│   └── Business logic implementation
└── 🗄️ Database (SQLite)
    ├── User management
    ├── Book catalog
    └── Transaction tracking
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: Express Sessions
- **Styling**: Custom CSS with CSS Grid & Flexbox
- **File Upload**: Multer (for book cover images)

## 📊 Key Metrics

- **📚 Book Limit**: 3 books per user
- **📅 Loan Period**: 7 days
- **👥 User Roles**: Student, Admin
- **🔄 Real-time Updates**: Instant availability tracking

## 🎯 Problem Solved

VULMS addresses critical issues in traditional library management:

- ❌ **Manual Errors** → ✅ **Automated Accuracy**
- ❌ **Limited Tracking** → ✅ **Real-time Monitoring**
- ❌ **Poor User Experience** → ✅ **Intuitive Interface**
- ❌ **No Enforcement** → ✅ **Automatic Rule Application**

## 📱 Screenshots

### Homepage
![Homepage](docs/screenshots/homepage.png)

### Library Catalog
![Library Catalog](docs/screenshots/library.png)

### User Dashboard
![User Dashboard](docs/screenshots/dashboard.png)

### Admin Panel
![Admin Panel](docs/screenshots/admin.png)

## 🐛 Known Issues

- Book cover images must be accessible URLs
- Session timeout is set to 24 hours
- SQLite database is file-based (suitable for development/small scale)

## 🔮 Future Enhancements

- [ ] Email notifications for due dates
- [ ] Book reservation system
- [ ] Fine management
- [ ] Barcode scanning integration
- [ ] Multi-language support
- [ ] Advanced reporting features



## 🙏 Acknowledgments

- **University of Venda** - For the opportunity to solve real-world problems
- **Node.js Community** - For excellent documentation and support
- **Express.js Team** - For the robust web framework
- **SQLite Team** - For the reliable database engine

---

<div align="center">
  <p>Made with ❤️ for Venda University</p>
  <p>© 2024 Venda University IT Department</p>
</div>
