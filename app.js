require("dotenv").config();

const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

const product_routes = require("./routes/product");
const notes_routes = require("./routes/notes");
const auth_routes = require("./routes/auth");

const connectDB = require("./db/connect");

app.get("/", (req, res) => {
    res.send("Hi, I'm live");
});

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// middleware or to set router

app.use("/api/products", product_routes)
app.use("/api/notes", notes_routes)
app.use("/api/auth", auth_routes)

const start = async () => {
    try {
        console.log("MongoDB URI:", process.env.MONGO_URI); // Debugging line
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