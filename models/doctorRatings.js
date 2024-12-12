const mongoose = require('mongoose');

// Define the DoctorRatings schema
const doctorRatingsSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating should be between 1 and 5
    reviewText: { type: String, required: true }, // Review text provided by the user
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who wrote the review
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // Doctor being reviewed
    createdAt: { type: Date, default: Date.now }, // Timestamp of review creation
}, {
    toJSON: { versionKey: false } // Exclude the __v field from JSON output
});

const DoctorRatings = mongoose.model('DoctorRatings', doctorRatingsSchema);

module.exports = DoctorRatings; // Export the model for use in other parts of the application