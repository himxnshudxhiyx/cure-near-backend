const mongoose = require('mongoose');

// Define the Hospital schema
const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    phone: { type: String },
    services: { type: [String] },
    category: { type: String, required: true },
}, {
    toJSON: { versionKey: false } // Exclude the __v field from JSON output
});

// Create a geospatial index for the location field
hospitalSchema.index({ location: '2dsphere' });

// Create the Hospital model
const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital; // Export the model for use in other parts of the application
