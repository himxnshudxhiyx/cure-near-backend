//models/doctors.js

const mongoose = require('mongoose');

// Define the Doctor schema
const doctorsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    about: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    totalPatientsServed: { type: Number, default: 0 },
    workingTime: {
        start: { type: String, required: true },
        end: { type: String, required: true }
    },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true } // Reference to the Hospital
}, {
    toJSON: { versionKey: false } // Exclude the __v field
});

const Doctors = mongoose.model('Doctor', doctorsSchema);

module.exports = Doctors;