// authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Adjust the path based on your project structure
const { secretKey } = require('../config'); // Replace with your secret key from config

const authMiddleware = async (req, res, next) => {
    const authToken = req.headers.authorization; // Get the token part from the Authorization header

    if (!authToken) {
        return res.status(401).json({ message: "Authorization token not provided", status: 401 });
    }

    try {
        const decoded = jwt.verify(authToken, secretKey);

        // Find the user in the database using the user ID from the token
        const user = await User.findById(decoded.user.id);
        if (!user || user.authToken !== authToken) {
            return res.status(401).json({ message: "Session expired. Please log in again.", status: 401 });
        }

        req.user = decoded.user; // Store user information from token payload in request object
        next();
    } catch (err) {
        console.error("Token validation error:", err);
        return res.status(401).json({ message: "Unauthorized: Invalid token", status: 401 });
    }
};

module.exports = authMiddleware;