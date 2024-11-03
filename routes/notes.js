// Import the Express module to create the router
const express = require('express');

// Import the authentication middleware to protect the routes
const authMiddleware = require('../middleware/authMiddleware');

// Create a new instance of an Express Router
const router = express.Router();

// Import the controller functions for handling notes operations
const { getAllNotes, updateNote, addNote , deleteNote, markAsDone} = require("../controllers/notes");

// Define a route for GET requests to the root URL of this router, using the authentication middleware
// and calling the getAllNotes controller function to fetch all notes
router.route('/').get(authMiddleware, getAllNotes);

// Define a route for POST requests to '/update' URL, using the authentication middleware
// and calling the updateNote controller function to update an existing note
router.route('/update').post(authMiddleware, updateNote); // New route for updating a note using POST

router.route('/markAsDone').post(authMiddleware, markAsDone); // New route for updating a note using POST

// Define a route for POST requests to '/add' URL, using the authentication middleware
// and calling the addNote controller function to add a new note
router.route('/add').post(authMiddleware, addNote); // New route for adding a note using POST

// Define a route for DELETE requests to '/delete' URL, using the authentication middleware
// and calling the deleteNote controller function to delete an existing note
router.route('/delete').post(authMiddleware, deleteNote);

// Export the router to be used in other parts of the application
module.exports = router;