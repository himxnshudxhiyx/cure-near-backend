const mongoose = require('mongoose');

// Define the Booking schema
const bookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Reference to the User model
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', // Reference to the Doctor model
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    time: { 
        type: String, // Store the time as a string (e.g., '09:00 AM', '02:30 PM')
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], // Status of the booking
        default: 'Pending' 
    },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;