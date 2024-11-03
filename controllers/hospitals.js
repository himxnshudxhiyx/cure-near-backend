// controllers/nearByHospitals.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config'); // Replace with your secret key from config
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Make sure to install nodemailer
require("dotenv").config();
const admin = require('firebase-admin');
const db = require('../db/connect'); // Path to your Firebase initialization file
const Hospital = require('../models/hospitals');

const getNearbyHospitals = async (req, res) => {
    const { lat, long, search } = req.body; // Extract lat, long, and search query from the request body

    // Validate latitude and longitude
    if (!lat || !long) {
        return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    try {
        // Define the search radius in meters (e.g., 5 km)
        const distanceInMeters = 5000; // 5 km
        const distanceInRadians = distanceInMeters / 6378137; // Convert distance to radians

        // Build the search query for the hospital name or other attributes
        const searchQuery = search ? { name: { $regex: search, $options: "i" } } : {};

        // Find nearby hospitals using geospatial query
        const hospitals = await Hospital.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(long), parseFloat(lat)], distanceInRadians] // Correctly use radians
                }
            },
            ...searchQuery // Combine with search query
        });

        res.status(200).json({
            data: hospitals,
            status: 200,
            message: "Hospitals list fetched successfully"
        }); // Return the list of hospitals
    } catch (err) {
        console.error("Error retrieving nearby hospitals:", err);
        res.status(500).json({ message: "Error retrieving hospitals", error: err.message, status: 500 });
    }
};

const addNewHospital = async (req, res) => {
    const { name, address, lat, long, phone, services } = req.body; // Extract hospital data from the request body

    // Validate required fields
    if (!name || !address || !lat || !long) {
        return res.status(400).json({ message: "Name, address, latitude, and longitude are required." });
    }

    try {
        // Create a new hospital instance
        const newHospital = new Hospital({
            name,
            address,
            location: {
                type: "Point",
                coordinates: [parseFloat(long), parseFloat(lat)] // Longitude first for GeoJSON
            },
            phone: phone || null, // Optional phone number
            services: services || [] // Optional array of services provided
        });

        // Save the new hospital to the database
        await newHospital.save();

        // Respond with the created hospital data
        res.status(201).json({
            data: newHospital,
            status: 201,
            message: "Hospital added successfully"
        });
    } catch (err) {
        console.error("Error adding new hospital:", err);
        res.status(500).json({ message: "Error adding hospital", error: err.message, status: 500 });
    }
};

module.exports = { getNearbyHospitals, addNewHospital };