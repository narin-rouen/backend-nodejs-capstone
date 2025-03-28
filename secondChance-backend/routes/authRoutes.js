const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // Assuming you have a logger setup
const connectToDatabase = require('../models/db');

const router = express.Router();
const JWT_SECRET = 'your_secret_key'; // Replace with a secure secret key

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // Check if user already exists
        const existingEmail = await collection.findOne({ email });
        if (existingEmail) {
            logger.error('Email already exists');
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = await collection.insertOne({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        });

        // Generate JWT token
        const payload = { user: { id: newUser.insertedId } };
        const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        logger.info('User registered successfully');
        res.status(201).json({ email, authToken });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
