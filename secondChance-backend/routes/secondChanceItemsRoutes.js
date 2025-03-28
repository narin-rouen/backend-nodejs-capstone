const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get('/api/secondchance/items', async (req, res, next) => {
    logger.info('/api/secondchance/items called');
    try {
        const db = await connectToDatabase();  // Get the database connection
        const collection = db.collection('secondChanceItems');  // Access the secondChanceItems collection
        const secondChanceItems = await collection.find({}).toArray();  // Fetch all items and convert them to a JSON array
        res.json(secondChanceItems);  // Return the fetched items as a JSON response
    } catch (e) {
        logger.console.error('oops something went wrong', e);
        next(e);  // Pass the error to the next middleware for error handling
    }
});

// Add a new item
router.post('/api/secondchance/items', upload.single('image'), async (req, res, next) => {
    try {
        const { name, description, price } = req.body;
        const imageUrl = req.file ? `public/images/${req.file.originalname}` : null; // Store the uploaded image URL

        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const result = await collection.insertOne({
            name,
            description,
            price,
            imageUrl,  // Store image URL in the document
        });

        res.status(201).json(result.ops[0]);  // Return the created secondChanceItem
    } catch (e) {
        next(e);  // Pass the error to the next middleware for error handling
    }
});

// Get a single secondChanceItem by ID
router.get('/api/secondchance/items/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const secondChanceItem = await collection.findOne({ _id: new require('mongodb').ObjectID(id) });

        if (!secondChanceItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(secondChanceItem);  // Return the found item as a JSON response
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/api/secondchance/items/:id', upload.single('image'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;
        const imageUrl = req.file ? `public/images/${req.file.originalname}` : null;  // Store the uploaded image URL

        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const result = await collection.updateOne(
            { _id: new require('mongodb').ObjectID(id) },
            { $set: { name, description, price, imageUrl } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = await collection.findOne({ _id: new require('mongodb').ObjectID(id) });
        res.json(updatedItem);  // Return the updated item as a JSON response
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/api/secondchance/items/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const result = await collection.deleteOne({ _id: new require('mongodb').ObjectID(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });  // Return a success message
    } catch (e) {
        next(e);
    }
});

module.exports = router;
