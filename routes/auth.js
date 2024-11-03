const express = require('express');

const router = express.Router();

const {signup, login, checkUser, verifyEmail, logout, getAllUsersWithDetails} = require("../controllers/auth");
const authMiddleware = require('../middleware/authMiddleware');

router.route('/signUp').post(signup);   
router.route('/login').post(login);
router.route('/checkUser').get(authMiddleware, checkUser);
router.route('/getAllUsers').get(authMiddleware, getAllUsersWithDetails);
router.route('/verify-email').get(verifyEmail);
router.route('/logout').post(authMiddleware, logout);

module.exports = router;