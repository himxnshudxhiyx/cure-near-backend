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
        // Retrieve user information from the request object (populated by authMiddleware)
        const userId = req.user.id; // Adjust based on how the user ID is stored in the token payload

        // Find the user in Firestore
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }

        const user = doc.data();

        // Exclude the password field
        const { password, __v, ...userWithoutSensitiveData } = user;

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
    const { username, password, firstName, lastName, phoneNumber } = req.body;

    try {
        // Check if username already exists
        const userRef = db.collection('users').doc(username);
        const doc = await userRef.get();
        if (doc.exists) {
            return res.status(400).json({ message: "Username already exists", status: 400 });
        }

        const phoneNumber = String(phoneNumber);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create new user
        const newUser = {
            username,
            password: hashedPassword,
            verificationToken,
            firstName,
            lastName,
            phoneNumber,
            isLoggedIn: false
        };

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const verificationLink = process.env.DEBUG_MODE === 'true'
            ? `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`
            : `https://notes-node-theta.vercel.app/api/auth/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: 'himanshud.dahiya@gmail.com',
            to: username,
            subject: 'Email Verification',
            text: `Please verify your account by clicking the following link: ${verificationLink}`,
        };

        await transporter.sendMail(mailOptions);

        // Save new user to Firestore
        await userRef.set(newUser);

        res.status(201).json({ message: "User registered successfully. Please check your email to verify your account.", status: 201 });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: "Error registering user", error: err.message, status: 500 });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        // Reference to the Firestore collection
        const usersRef = db.collection('users');
        const query = usersRef.where('verificationToken', '==', token);
        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(400).json({ message: "Invalid verification token" });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Update user document
        await userDoc.ref.update({
            verified: true,
            verificationToken: admin.firestore.FieldValue.delete() // Correctly delete the verification token field
        });
        res.redirect('/public/verification-success.html');
        // res.status(200).json({ message: "Email verified successfully" });
    } catch (err) {
        console.error("Error verifying email:", err);
        res.status(500).json({ message: "Error verifying email", error: err.message });
    }
};


// const login = async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         // Check if user exists
//         const userWithPassword = await User.findOne({ username });
//         if (!userWithPassword) {
//             return res.status(404).json({ message: "User not found", status: 400 });
//         }

//         // Check if user is verified
//         if (!userWithPassword.verified) {
//             return res.status(403).json({ message: "Please verify your account to login", status: 403 });
//         }

//         // Validate password
//         const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: "Invalid credentials", status: 401 });
//         }

//         // Fetch user details without password and __v
//         const user = await User.findOne({ username }).select('-password -__v');

//         if (user.isLoggedIn) {
//             return res.status(400).json({ message: "User already logged in on another device", status: 400 });
//         }

//         await User.updateOne({ username }, { $set: { isLoggedIn: true } });

//         // Generate authToken
//         const authToken = jwt.sign({ user: { id: user._id, username: user.username } }, secretKey, { expiresIn: '24h' });

//         // Return authToken and user details (excluding password and __v fields)
//         res.status(200).json({ authToken, user, 'message': 'Login Successfully', status: 200 });
//     } catch (err) {
//         console.error("Error logging in:", err);
//         res.status(500).json({ message: "Error logging in", error: err.message, status: 500 });
//     }
// };

const login = async (req, res) => {
    const { username, password, fcmToken } = req.body;

    try {
        // Reference to Firestore collection
        const userRef = db.collection('users').doc(username);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }

        const userWithPassword = doc.data();

        // Check if user is verified
        if (!userWithPassword.verified) {
            return res.status(403).json({ message: "Please verify your account to login", status: 403 });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials", status: 401 });
        }

        // Check if the user is already logged in on another device
        // if (userWithPassword.isLoggedIn) {
        //     return res.status(400).json({ message: "User already logged in on another device", status: 400 });
        // }

        // Update user status to logged in
        await userRef.update({ isLoggedIn: true, fcmToken: fcmToken });

        // Generate authToken
        const authToken = jwt.sign(
            { user: { id: username, username: userWithPassword.username } },
            secretKey,
            { expiresIn: '30d' }
        );

        // Return authToken and user details (excluding password)
        const { password: _, ...userWithoutPassword } = userWithPassword; // Exclude password field
        res.status(200).json({ authToken, user: userWithoutPassword, message: 'Login Successfully', status: 200 });
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