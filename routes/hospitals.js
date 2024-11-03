const express = require('express');

const router = express.Router();

const {getNearbyHospitals, addNewHospital} = require("../controllers/hospitals");
const authMiddleware = require('../middleware/authMiddleware');

router.route('/getNearbyHospitals').post(authMiddleware, getNearbyHospitals);
router.route('/addNewHospital').post(authMiddleware, addNewHospital);

module.exports = router;