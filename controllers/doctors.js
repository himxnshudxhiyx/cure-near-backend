// controllers/doctors.js

const { default: mongoose } = require('mongoose');
const DoctorRatings = require('../models/doctorRatings');
const Doctors = require('../models/doctors'); // Import the Doctor model
const Hospital = require('../models/hospitals'); // Import the Hospital model (assumes you have a Hospital model)
const Booking = require('../models/booking');

// Function to add a doctor to a hospital
const addDoctorToHospital = async (req, res) => {
    try {
        const { name, address, category, about, yearsOfExperience, totalPatientsServed, workingTime, hospitalId } = req.body;

        // Validate the required fields
        if (!name || !category || !about || !yearsOfExperience || !workingTime || !hospitalId) {
            return res.status(400).json({ message: "All fields are required.", status: 400 });
        }

        // Check if the hospital exists
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found.", status: 404 });
        }

        // Create a new doctor instance
        const doctor = new Doctors({
            name,
            category,
            about,
            yearsOfExperience,
            totalPatientsServed,
            workingTime,
            hospitalId
        });

        // Save the doctor
        await doctor.save();

        res.status(201).json({
            message: "Doctor added to hospital successfully.",
            doctor,
            status: 201
        });
    } catch (error) {
        console.error("Error adding doctor to hospital:", error);
        res.status(500).json({ message: "An error occurred.", error: error.message, status: 500 });
    }
};

const getDoctorDetails = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Find the doctor and populate hospital details
        const doctor = await Doctors.findById(doctorId).populate('hospitalId', 'name address');

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found", status: 404 });
        }

        // Calculate the average rating and rating count using aggregation
        const ratings = await DoctorRatings.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } }, // Match ratings for this doctor
            {
                $group: {
                    _id: "$doctorId", // Group by doctorId
                    avgRating: { $avg: "$rating" }, // Calculate average rating
                    ratingCount: { $sum: 1 } // Count the number of reviews
                }
            }
        ]);

        // If there are no reviews, set default values
        const averageRating = ratings.length > 0 ? ratings[0].avgRating : 0;
        const ratingCount = ratings.length > 0 ? ratings[0].ratingCount : 0;

        // Remove __v field before sending the response
        const doctorWithoutV = doctor.toObject();
        delete doctorWithoutV.__v;

        res.status(200).json({
            message: "Doctor details retrieved successfully",
            doctor: {
                ...doctorWithoutV,
                averageRating, // Add average rating to doctor details
                ratingCount     // Add rating count to doctor details
            },
            status: 200
        });
    } catch (error) {
        console.error("Error retrieving doctor details:", error);
        res.status(500).json({ message: "An error occurred", error: error.message, status: 500 });
    }
};

const markAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId, doctorId, status } = req.body; // Extract appointmentId, doctorId, and status from the request body

        // Validate input fields
        if (!appointmentId || !doctorId || !status) {
            return res.status(400).json({ message: "Appointment ID, Doctor ID, and status are required.", status: 400 });
        }

        // Validate the status
        const validStatuses = ["Completed", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status. Allowed statuses are 'Completed' or 'Cancelled'.", status: 400 });
        }

        // Find the appointment
        const appointment = await Booking.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found.", status: 404 });
        }

        // Check if the doctor ID matches the doctor assigned to the appointment
        if (appointment.doctorId.toString() !== doctorId) {
            return res.status(403).json({
                message: "Doctor is not authorized to update this appointment.",
                status: 403
            });
        }

        // Update the appointment status
        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            message: `Appointment marked as ${status} successfully.`,
            appointment,
            status: 200
        });
    } catch (error) {
        console.error("Error updating appointment status:", error);
        res.status(500).json({ message: "An error occurred while updating the appointment status.", error: error.message, status: 500 });
    }
};

module.exports = { addDoctorToHospital, getDoctorDetails, markAppointmentStatus };