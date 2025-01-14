const express = require('express');

const router = express.Router();
const upload = require("../multer/multer");

const {signup, login, checkUser, verifyEmail, logout, getAllUsersWithDetails, profileSetup, sendOtpToEmail, verifyEmailOtp, changePassword} = require("../controllers/auth");
const authMiddleware = require('../middleware/authMiddleware');

router.route('/signUp').post(signup);   
router.route('/login').post(login);
router.route('/checkUser').get(authMiddleware, checkUser);
router.route('/getAllUsers').get(authMiddleware, getAllUsersWithDetails);
router.route('/verify-email').get(verifyEmail);
router.route('/logout').post(authMiddleware, logout);
router.route('/forgotPassword').post(sendOtpToEmail);
router.route('/verifyEmailOtp').post(verifyEmailOtp);
router.route('/changePassword').post(changePassword);
router.route('/profile-setup').post(authMiddleware, upload.single("profileImage"), profileSetup);

module.exports = router;