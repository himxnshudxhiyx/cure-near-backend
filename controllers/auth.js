// controllers/auth.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config'); // Replace with your secret key from config
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Make sure to install nodemailer
require("dotenv").config();
const admin = require('firebase-admin');
const db = require('../db/connect'); // Path to your Firebase initialization file


const checkUser = async (req, res) => {
    try {
        // Retrieve user ID from the request object (populated by authMiddleware)
        const userId = req.user.id; // Ensure `user.id` corresponds to MongoDB's `_id`

        // Find the user in MongoDB
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }

        // Exclude sensitive data like password and any version keys
        const { password, __v, ...userWithoutSensitiveData } = user.toObject();

        res.status(200).json({ user: userWithoutSensitiveData, status: 200 });
    } catch (err) {
        console.error("Error checking user details:", err);
        res.status(500).json({ message: "Error checking user details", error: err.message, status: 500 });
    }
};

const getAllUsersWithDetails = async (req, res) => {
    const loggedInUserId = req.user.id; // Retrieve the ID of the logged-in user from middleware

    try {
        // Reference to the Firestore collection for users
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "No users found", status: 404 });
        }

        // Initialize an array to store users with their details
        const usersWithDetails = [];

        for (const doc of snapshot.docs) {
            const userId = doc.id;
            const userData = doc.data();

            // Skip the current logged-in user
            if (userId === loggedInUserId) {
                continue;
            }

            // Exclude sensitive fields
            const { fcmToken, password, ...filteredUserData } = userData;

            // Add filtered user data to the result
            usersWithDetails.push({
                id: userId,
                ...filteredUserData
            });
        }

        const count = usersWithDetails.length;

        res.status(200).json({ data: usersWithDetails, count, message: "Users and their details found successfully", status: 200 });
    } catch (err) {
        console.error("Error fetching users and details:", err);
        res.status(500).json({ message: "Error fetching users and details", error: err.message, status: 500 });
    }
};


const signup = async (req, res) => {
    const { username, password, firstName, lastName, phoneNumberReq } = req.body;

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists", status: 400 });
        }

        const phoneNumber = String(phoneNumberReq);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword,
            verificationToken,
            firstName,
            lastName,
            phoneNumber,
            isLoggedIn: false
        });

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const verificationLink = process.env.DEBUG_MODE === "true"
            ? `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`
            : `https://cure-near-backend.vercel.app/api/auth/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: "himanshud.dahiya@gmail.com",
            to: username,
            subject: "Email Verification",
            text: `Please verify your account by clicking the following link: ${verificationLink}`,
        };

        await transporter.sendMail(mailOptions);

        // Save new user to MongoDB
        await newUser.save();

        res.status(201).json({ message: "User registered successfully. Please check your email to verify your account.", status: 201 });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: "Error registering user", error: err.message, status: 500 });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        // Find user by verification token
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: "Invalid verification token" });
        }

        // Update user to mark as verified and remove the verification token
        await User.updateOne(
            { _id: user._id },
            { $set: { verified: true }, $unset: { verificationToken: "" } }
        );

        // Redirect to success page or send a success message
        res.redirect('/public/verification-success.html');
        // res.status(200).json({ message: "Email verified successfully" });
    } catch (err) {
        console.error("Error verifying email:", err);
        res.status(500).json({ message: "Error verifying email", error: err.message });
    }
};

const login = async (req, res) => {
    const { username, password, fcmToken } = req.body;

    try {
        // Find the user in MongoDB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }

        // Check if the account is verified
        if (!user.verified) {
            return res.status(403).json({ message: "Please verify your account to login", status: 403 });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials", status: 401 });
        }

        // Generate new authToken
        const authToken = jwt.sign(
            { user: { id: user._id, username: user.username } },
            secretKey,
            { expiresIn: '30d' }
        );

        // Update the user with the new token and FCM token
        await User.updateOne(
            { _id: user._id },
            { $set: { authToken, fcmToken, isLoggedIn: true } }
        );

        const newUser = await User.findOne({ username });


        // Return authToken and user details (excluding password)
        const { password: _, authToken: __, __v, ...userWithoutSensitiveData } = newUser.toObject();
        res.status(200).json({ authToken, user: userWithoutSensitiveData, message: 'Login Successfully', status: 200 });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).json({ message: "Error logging in", error: err.message, status: 500 });
    }
};

const logout = async (req, res) => {
    const userId = req.user.id; // Extract user ID from the authenticated request

    try {
        // Find the user document and update isLoggedIn to false
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }

        // Update user status
        await userDocRef.update({ isLoggedIn: false });

        res.status(200).json({ message: 'Logout Successful', status: 200 });
    } catch (err) {
        console.error('Error logging out:', err);
        res.status(500).json({ message: 'Error logging out', error: err.message, status: 500 });
    }
};


module.exports = { signup, login, checkUser, verifyEmail, logout, getAllUsersWithDetails };