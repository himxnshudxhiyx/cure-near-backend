const express = require('express');

const router = express.Router();

const {addDoctorToHospital, getDoctorDetails, markAppointmentStatus} = require("../controllers/doctors");
const {bookAppointment, getBookingsOfUser, getAvailableTimeSlots} = require("../controllers/booking");
const {addReviewForDoctor, getRatingsOfDoctor} = require("../controllers/doctorRatings");
const authMiddleware = require('../middleware/authMiddleware');

router.route('/getDoctorDetails/:doctorId').get(authMiddleware, getDoctorDetails);
router.route('/getRatingsOfDoctor/:doctorId').get(authMiddleware, getRatingsOfDoctor);
router.route('/addDoctorToHospital').post(authMiddleware, addDoctorToHospital);
router.route('/addReviewForDoctor').post(authMiddleware, addReviewForDoctor);
router.route('/bookAppointment').post(authMiddleware, bookAppointment);
router.route('/getAvailableTimeSlots').post(authMiddleware, getAvailableTimeSlots);
router.route('/getBookignsOfUser').get(authMiddleware, getBookingsOfUser);
router.route('/markAppointmentStatus').post(authMiddleware, markAppointmentStatus);

module.exports = router;