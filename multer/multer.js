const multer = require("multer");
const path = require("path");

// Configure storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads/"));  // Ensure directory path is correct
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);  // Unique filename
    }
});

// Create upload instance
const upload = multer({ storage: storage });

module.exports = upload;