const express = require('express');

const router = express.Router();

const {addDoctorToHospital, getDoctorDetails} = require("../controllers/doctors");
const {addReviewForDoctor} = require("../controllers/doctorRatings");
const authMiddleware = require('../middleware/authMiddleware');

router.route('/getDoctorDetails/:doctorId').get(authMiddleware, getDoctorDetails);
router.route('/addDoctorToHospital').post(authMiddleware, addDoctorToHospital);
router.route('/addReviewForDoctor').post(authMiddleware, addReviewForDoctor);

module.exports = router;