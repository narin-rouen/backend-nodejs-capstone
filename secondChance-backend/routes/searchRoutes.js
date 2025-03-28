const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for gifts
router.get('/', async (req, res, next) => {
    try {
        // Task 1: Connect to MongoDB using connectToDatabase database. Remember to use the await keyword and store the connection in `db`
        const db = await connectToDatabase(); // Connect to the database

        const collection = db.collection("gifts");

        // Initialize the query object
        let query = {};

        // Task 2: Check if the name exists and is not empty
        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name, $options: "i" }; // Using regex for partial match, case-insensitive
        }

        // Task 3: Add other filters to the query
        if (req.query.category) {
            query.category = req.query.category; // Filter by category
        }
        if (req.query.condition) {
            query.condition = req.query.condition; // Filter by condition
        }
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) }; // Filter by age_years (less than or equal to the provided value)
        }

        // Task 4: Fetch filtered gifts using the find(query) method. Make sure to use await and store the result in the `gifts` constant
        const gifts = await collection.find(query).toArray();

        // Return the filtered results as a JSON response
        res.json(gifts);
    } catch (e) {
        next(e); // Pass the error to the next middleware for error handling
    }
});

module.exports = router;
