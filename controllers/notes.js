const Notes = require("../models/notes");
const db = require('../db/connect'); // Path to your Firebase initialization file
const admin = require('firebase-admin');

const getAllNotes = async (req, res) => {
    const userId = req.user.id; // Extract user ID from authenticated request

    try {
        // Reference to the Firestore collection for notes
        const notesRef = db.collection('notes');

        // Query to get all notes for the user
        const query = notesRef.where('userId', '==', userId);
        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "No notes found", status: 404 });
        }

        // Extract note data
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const count = notes.length;

        res.status(200).json({ data: notes, count, message: "Notes found Successfully", status: 200 });
    } catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).json({ message: "Error fetching notes", error: err.message , status: 500});
    }
};

const updateNote = async (req, res) => {
    const { id, title, description } = req.body;

    try {
        // Reference to the Firestore document
        const noteRef = db.collection('notes').doc(id);

        // Update the note
        const result = await noteRef.update({ title, description });

        // Check if the document exists after the update
        const updatedDoc = await noteRef.get();
        if (!updatedDoc.exists) {
            return res.status(404).json({ message: "Note not found", status: 404 });
        }

        // Return the updated note
        res.status(200).json({ data: { id: updatedDoc.id, ...updatedDoc.data() }, message: "Note updated successfully", status: 200 });
    } catch (err) {
        console.error("Error updating note:", err);
        res.status(500).json({ message: "Error updating note", error: err.message, status: 500 });
    }
};

const addNote = async (req, res) => {
    const { title, description, noteStatus } = req.body;
    const userId = req.user.id; // Extract user ID from authenticated request

    try {
        // Reference to the Firestore collection for notes
        const notesRef = db.collection('notes');
        
        // Check if a note with the same title already exists for the user
        const query = notesRef.where('userId', '==', userId).where('title', '==', title);
        const snapshot = await query.get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: "Title already exists", status: 400 });
        }

        // Create and save the new note if the title does not exist
        const newNoteRef = notesRef.doc(); // Create a new document reference
        const createdAt = new Date().toISOString(); // Get the current timestamp in ISO 8601 format

        await newNoteRef.set({ userId, title, description, noteStatus, createdAt});

        res.status(201).json({ message: "Note added successfully", status: 201 });
    } catch (err) {
        console.error("Error adding note:", err);
        res.status(500).json({ message: "Error adding note", error: err.message, status: 500 });
    }
};

const markAsDone = async (req, res) => {
    const { id, noteStatus } = req.body;

    try {
        // Reference to the Firestore document
        const noteRef = db.collection('notes').doc(id);

        // Update the note status
        await noteRef.update({ noteStatus });

        // Retrieve the updated document
        const updatedDoc = await noteRef.get();
        if (!updatedDoc.exists) {
            return res.status(404).json({ message: "Note not found", status: 404 });
        }

        // Get the user ID from the note document
        const userId = updatedDoc.data().userId;

        // Retrieve the user's FCM token from Firestore
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }
        const fcmToken = userDoc.data().fcmToken;

        // if (!fcmToken) {
            // return res.status(404).json({ message: "FCM token not found for the user", status: 404 });
        // }

        // Prepare the notification message
        const message = {
            notification: {
                title: 'Note Status Updated',
                body: `Your note "${updatedDoc.data().title}" status has been updated to ${noteStatus}.`,
            },
            token: fcmToken,
        };

        // Send the notification
        await admin.messaging().send(message);

        // Return the updated note
        res.status(200).json({ data: { id: updatedDoc.id, ...updatedDoc.data() }, message: "Note updated successfully", status: 200 });
    } catch (err) {
        console.error("Error updating note:", err);
        res.status(500).json({ message: "Error updating note", error: err.message, status: 500 });
    }
};

const deleteNote = async (req, res) => {
    const { id } = req.body; // Extract note ID from the request body
    const userId = req.user.id; // Extract user ID from the authenticated request

    try {
        // Reference to the Firestore document
        const noteRef = db.collection('notes').doc(id);

        // Get the note to check ownership
        const noteDoc = await noteRef.get();
        if (!noteDoc.exists) {
            return res.status(404).json({ message: "Note not found or you don't have permission to delete it", status: 404 });
        }

        // Check if the note belongs to the user
        if (noteDoc.data().userId !== userId) {
            return res.status(403).json({ message: "You don't have permission to delete this note", status: 403 });
        }

        // const userId = updatedDoc.data().userId;

        // Retrieve the user's FCM token from Firestore
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found", status: 404 });
        }

        const fcmToken = userDoc.data().fcmToken;

        // if (!fcmToken) {
            // return res.status(404).json({ message: "FCM token not found for the user", status: 404 });
        // }

        // Prepare the notification message
        const message = {
            notification: {
                title: 'Note Status Updated',
                body: `Your note has been deleted successfully`,
            },
            token: fcmToken,
        };

        // Send the notification
        await admin.messaging().send(message);

        // Delete the note
        await noteRef.delete();

        res.status(200).json({ message: "Note deleted successfully", status: 200 });
    } catch (err) {
        console.error("Error deleting note:", err);
        res.status(500).json({ message: "Error deleting note", error: err.message, status: 500 });
    }
};

module.exports = { getAllNotes, updateNote, addNote, markAsDone, deleteNote};