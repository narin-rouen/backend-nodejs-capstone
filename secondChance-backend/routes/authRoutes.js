const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/import-mongo/logger');
const connectToDatabase = require('../models/db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// UPDATE USER ROUTE
router.put('/update', [
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('password').optional().isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Validation errors in update request', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const email = req.headers.email;
        if (!email) {
            logger.error('Email not found in the request headers');
            return res.status(400).json({ error: "Email not found in the request headers" });
        }

        const db = await connectToDatabase();
        const collection = db.collection('users');

        const existingUser = await collection.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedFields = { ...req.body, updatedAt: new Date() };

        if (updatedFields.password) {
            const salt = await bcryptjs.genSalt(10);
            updatedFields.password = await bcryptjs.hash(updatedFields.password, salt);
        }

        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: updatedFields },
            { returnDocument: 'after' }
        );

        const payload = { user: { id: updatedUser._id.toString() } };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.json({ authtoken, message: 'User updated successfully' });
    } catch (e) {
        logger.error('Error updating user', e);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
