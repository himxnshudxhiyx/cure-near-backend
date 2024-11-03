require("dotenv").config();
const connectDB = require("./db/connect");
const product = require("./models/product");
const productModel = require("./models/product");

const productData = require('./products.json');

const start = async () => {
    try {
await connectDB(process.env.MONGO_URL);
await product.deleteMany();
await product.create(productData);
console.log("Success");
    } catch (error){
console.log(error);
    }
}

start();