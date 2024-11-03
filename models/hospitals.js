const mongoose = require('mongoose');

// Define the Hospital schema
const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the hospital
    address: { type: String, required: true }, // Address of the hospital
    location: {
        type: { type: String, enum: ['Point'], required: true }, // Type must be 'Point' for GeoJSON
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    phone: { type: String }, // Optional phone number
    services: { type: [String] } // Optional array of services provided
});

// Create a geospatial index for the location field
hospitalSchema.index({ location: '2dsphere' });

// Create the Hospital model
const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital; // Export the model for use in other parts of the application
