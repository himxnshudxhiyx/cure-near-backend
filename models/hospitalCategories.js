const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const HospitalCategory = mongoose.model('HospitalCategory', categorySchema);

module.exports = HospitalCategory;
