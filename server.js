const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { verifyToken } = require('./middleware/auth');
const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');
const cookieParser = require('cookie-parser');
const cors = require('cors');


app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true     
}));

app.use(cookieParser());

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], products: [], orders: [], cart: [] }, null, 2));
    console.log('Database file created successfully');
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Public Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

app.use('/api/editprofile', require('./routes/editprofile'));

// Protected Routes - require authentication
app.use('/api/cart', verifyToken, require('./routes/cart'));
app.use('/api/orders', verifyToken, require('./routes/orders'));


// Error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
});

// Serve `index.html` for all unknown routes (SPA Fallback)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
