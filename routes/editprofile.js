const express = require('express');
const app = express();
const router = express.Router();
const { loadDatabase, saveDatabase } = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage for saving files to disk (you can change the path as needed)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public');
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}${fileExtension}`;  // Use a unique filename
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });

// Get user profile data
router.get('/getProfile', (req, res) => {
    console.log("Cookies:", req.cookies);

    const userId = req.cookies.userId;

    if (!userId) {
        console.log("User ID not found in cookies.");
        return res.status(400).json({ message: 'User ID not found in cookies' });
    }

    let db = loadDatabase();
    const user = db.users.find(user => user.id === userId);

    if (!user) {
        console.log("User not found with ID:", userId);
        return res.status(404).json({ message: 'User not found' });
    }

    console.log("Found user:", user);

    res.status(200).json({
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        profilePicture: user.profilePicture,
    });
});
    
router.post('/updateProfile', upload.single('profilePicture'), (req, res) => {
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body); 
    console.log("Uploaded file:", req.file); 

    const userId = req.cookies.userId;

    if (!userId) {
        console.log("User ID not found in cookies.");
        return res.status(400).json({ message: 'User ID not found in cookies' });
    }

    let db = loadDatabase();
    const user = db.users.find(user => user.id === userId);

    if (!user) {
        console.log("User not found with ID:", userId);
        return res.status(404).json({ message: 'User not found' });
    }

    // Update user data with the new values from the request body
    const { name, email, address, phone } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;
    if (phone) user.phone = phone;

    if (req.file) {
        user.profilePicture = req.file.filename; 
    }

    // Save the updated database
    saveDatabase(db);

    console.log("Updated user:", user);

    res.status(200).json({ message: 'Profile updated successfully', user: user });
});

module.exports = router;
