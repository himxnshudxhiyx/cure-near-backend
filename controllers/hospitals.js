// controllers/hospitals.js

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
const HospitalCategory = require('../models/hospitalCategories');

const getNearbyHospitals = async (req, res) => {
    const { lat, long, search, cat } = req.body; // Extract lat, long, and search query from the request body

    // Validate latitude and longitude
    if (!lat || !long) {
        return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    try {
        // Define the search radius in meters (e.g., 10 km)
        const distanceInMeters = 10000; // 10 km
        const distanceInRadians = distanceInMeters / 6378137; // Convert distance to radians

        // Build the search query for the hospital name or other attributes
        // Build the search query
        // const searchQuery = {
        //     $or: [
        //         search ? { name: { $regex: search, $options: "i" } } : {},
        //         search ? { services: { $regex: search, $options: "i" } } : {},
        //     ]
        // };

        const searchConditions = [];

        // Add conditions only if the corresponding variables are present
        if (search != "") {
            searchConditions.push({ name: { $regex: search, $options: "i" } });
            searchConditions.push({ services: { $regex: search, $options: "i" } });
        }

        if (cat != "") {
            searchConditions.push({ category: { $regex: cat, $options: "i" } });
        }

        const searchQuery = searchConditions.length > 0 ? { $or: searchConditions } : {};

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
            totalRecords: hospitals.length,
            status: 200,
            message: "Hospitals list fetched successfully"
        }); // Return the list of hospitals
    } catch (err) {
        console.error("Error retrieving nearby hospitals:", err);
        res.status(500).json({ message: "Error retrieving hospitals", error: err.message, status: 500 });
    }
};



//Demo Json ->
// {
//     "lat": "28.9945832",
//     "long": "77.0281157",
//     "name": "Dudeja Hospital",
//     "address": "ASDASDASDASD",
//     "phone": "+918888888888",
//     "services": ["Ear"],
//     "category": ["Cardiality"]
// }

const addNewHospital = async (req, res) => {


    const { name, address, lat, long, phone, services, category } = req.body; // Extract hospital data from the request body

    // Validate required fields
    if (!name || !address || !lat || !long) {
        return res.status(400).json({ message: "Name, address, latitude, and longitude are required." });
    }

    try {

        const existingHospital = await Hospital.findOne({
            name: name,
            phone: phone
        });

        if (existingHospital) {
            return res.status(400).json({ message: "Hospital already exists.", status: 400 });
        }

        // Create a new hospital instance
        const newHospital = new Hospital({
            name,
            address,
            location: {
                type: "Point",
                coordinates: [parseFloat(long), parseFloat(lat)] // Longitude first for GeoJSON
            },
            phone: phone || null, // Optional phone number
            services: services || [], // Optional array of services provided
            category: category
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

// const saveHospitalCategories = async () => {
//     const categories = [
//         "Dentistry", "Cardiology", "Neurology", "Orthopedics", 
//         "Pediatrics", "Obstetrics and Gynecology", "Oncology", 
//         "Gastroenterology", "Endocrinology", "Pulmonology", 
//         "Dermatology", "Psychiatry", "Urology", "Rheumatology", 
//         "Ophthalmology", "Emergency Medicine", "Radiology", 
//         "Plastic Surgery", "Anesthesiology", "Hematology"
//     ];

//     for (const categoryName of categories) {
//         const category = new HospitalCategory({ name: categoryName });
//         await category.save();
//     }

//     console.log("Hospital categories saved successfully.");
// };


const getHospitalCategories = async (req, res) => {
    try {
        // Retrieve all hospital categories from the database
        const categories = await HospitalCategory.find();

        // Respond with the list of categories
        res.status(200).json({
            data: categories,
            status: 200,
            message: "Hospital categories fetched successfully"
        });
    } catch (err) {
        console.error("Error retrieving hospital categories:", err);
        res.status(500).json({ message: "Error retrieving hospital categories", error: err.message, status: 500 });
    }
};


module.exports = { getNearbyHospitals, addNewHospital, getHospitalCategories };