const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const nodemailer = require('nodemailer');
const { loadDatabase, saveDatabase } = require('../utils/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Register Route
router.post('/register', (req, res) => {
    const { name, email, password, address = "", phone = "", profilePicture = "" } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    let db = loadDatabase();
    if (db.users.some(user => user.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        const newUser = { id: uuid.v4(), name, email, password: hash, address, phone, profilePicture };
        db.users.push(newUser);
        saveDatabase(db);

        // Create token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res
        .cookie('userId', newUser.id, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: 'Lax',
        })
        .cookie('userName', newUser.name, {
            httpOnly: false, // You can access this in client-side JS if needed
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'Lax',
        })
        .status(201)
        .json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                address: newUser.address,
                phone: newUser.phone,
                profilePicture: newUser.profilePicture,
            }
        });

    });
});

router.post("/profile", (req, res) => {
    const { token } = req.body;

    console.log(token)

    let db = loadDatabase();
    
    const decoded = verifyToken(token, JWT_SECRET);

    console.log(decoded)

})

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    let db = loadDatabase();
    const user = db.users.find(user => user.email === email);
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            // Create token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res
            .cookie('userId', user.id, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'Lax',
            })
            .cookie('userName', user.name, {
                httpOnly: false,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'Lax',
            })
            .status(200)
            .json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });

        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    });
});

// Verify Token Route
router.get('/verify', verifyToken, (req, res) => {
    let db = loadDatabase();
    const user = db.users.find(user => user.id === req.user.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
        valid: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});


// Setup email transporter using Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use any email service provider you prefer
    auth: {
        user: 'thepro070707@gmail.com',  // Replace with your email
        pass: 'addq sdgc cdur ghqf'    // Replace with your email password or app-specific password
    }
});

// Forgot Password Route
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    let db = loadDatabase();
    const user = db.users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // Generate a reset token (JWT) that expires in 1 hour
    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // Create reset URL
    const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;

    // Send the reset link to the user's email
    const mailOptions = {
        from: 'thepro070707@gmail.com',  // Sender email
        to: email,                    // Recipient email
        subject: 'Password Reset Request',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>` // HTML content of the email
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log('Error sending email:', err);
            return res.status(500).json({ message: 'Error sending email' });
        }
        res.status(200).json({ message: 'Password reset link sent' });
    });
});

// Reset Password Route
router.post('/reset-password', (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Both new password and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Verify the reset token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = decoded.userId;
        let db = loadDatabase();

        const user = db.users.find(u => u.id === userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Hash the new password before saving (for security)
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: 'Error hashing password' });
            }

            user.password = hashedPassword; // Update the user's password with the new hashed one
            saveDatabase(db);  // Save the updated database

            res.status(200).json({ message: 'Password successfully reset' });
        });
    });
});


module.exports = router; 