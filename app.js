require("dotenv").config();

const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

const product_routes = require("./routes/product");
const notes_routes = require("./routes/notes");
const auth_routes = require("./routes/auth");
const hospital_routes = require("./routes/hospitals");
const doctor_routes = require("./routes/doctors");

const connectDB = require("./db/connect");

app.get("/", (req, res) => {
    res.send("Welcome to Cure Near");
});

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// middleware or to set router

app.use("/api/products", product_routes)
app.use("/api/notes", notes_routes)
app.use("/api/auth", auth_routes)
app.use("/api/hospitals", hospital_routes)
app.use("/api/doctors", doctor_routes)

const start = async () => {
    try {

        // console.log("MongoDB URI:", process.env.MONGO_URI); // Debugging line
        connectDB(process.env.MONGO_URI)
            .then(() => console.log("Database connected successfully"))
            .catch((error) => console.error("Database connection failed:", error));
        app.listen(PORT, () => {
            console.log(PORT + " Yes I am connected");
        });

    } catch (error) {
        console.log(error);
    }
};

start();