const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: false, unique: true },
    password: { type: String, required: false },
    fullname: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phoneNumber: { type: String, required: false }, // Changed to String
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    isLoggedIn: { type: Boolean, default: false }, // Add this field
    authToken: { type: String },
    fcmToken: { type: String },
    profileImage: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    userId: { type: String },
    isProfileSetup: { type: Boolean },
});

module.exports = mongoose.model('User', userSchema);