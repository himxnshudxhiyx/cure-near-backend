const DoctorRatings = require('../models/doctorRatings');
const Doctors = require('../models/doctors'); // To verify the doctor exists

const addReviewForDoctor = async (req, res) => {
    try {
        const { rating, reviewText, doctorId } = req.body;
        const userId = req.user.id; // Get userId from the authenticated user (assumed from authMiddleware)

        // Validate the required fields
        if (!rating || !reviewText || !doctorId) {
            return res.status(400).json({ message: "Rating, review text, and doctor ID are required." });
        }

        // Validate the rating value (should be between 1 and 5)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        // Check if the doctor exists
        const doctor = await Doctors.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found." });
        }

        // Create a new review document
        const newReview = new DoctorRatings({
            rating,
            reviewText,
            userId,
            doctorId
        });

        // Save the review to the database
        await newReview.save();

        res.status(201).json({
            message: "Review added successfully.",
            review: newReview,
            status: 201
        });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "An error occurred while adding the review.", error: error.message });
    }
};

module.exports = { addReviewForDoctor};