const productData = require("../models/product");
const { options } = require("../routes/product");


const getAllProductsTesting = async (req, res) => {
    const data = await productData.find();
    res.status(200).json({ data, message: "Data found successfully", status: res.status });
};

const getAllProducts = async (req, res) => {
    const { name, sort, priceMin, priceMax, company, select } = req.query; // Extract query parameters

    const newQuery = {};

    console.log(company, "Company");

    if (company) {
        newQuery.company = company;
    }

    // Filter by name using regex if provided
    if (name) {
        newQuery.name = { $regex: name, $options: "i" };
    }

    // Filter by price range if both priceMin and priceMax are provided
    if (priceMin && priceMax) {
        newQuery.price = { $gte: parseInt(priceMin), $lte: parseInt(priceMax) };
    } else if (priceMin) {
        newQuery.price = { $gte: parseInt(priceMin) };
    } else if (priceMax) {
        newQuery.price = { $lte: parseInt(priceMax) };
    }

    console.log(req.query);
    console.log("The above is the request");

    try {
        let query = productData.find(newQuery);

        // Apply sorting if sort parameter is provided
        if (sort) {
            const sortOptions = {};
            const [field, order] = sort.split("_");
            console.log("Feild", field, "Order", order);
            sortOptions[field] = order === 'asc' ? 1 : -1;
            query = query.sort(sortOptions);
        }

        if (select) {
            let selectFix = select.replace(',', ' ');
            query = query.select(selectFix);
        }

        const data = await query.exec();
        const count = await productData.countDocuments(newQuery);

        res.status(200).json({ data,'count': count, message: "Data found successfully", status: res.status });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

const updateProduct = async (req, res) => {
    console.log(req.body);
    const { id, updateData } = req.body;

    try {
        const updatedProduct = await productData.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ data: updatedProduct, message: "Product updated successfully" });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
};

const addProduct = async (req, res) => {
    const { name, price, featured, rating, company } = req.body;

    try {
        // Check if product with same name and company already exists
        const existingProduct = await productData.findOne({ name, company });
        if (existingProduct) {
            return res.status(400).json({ message: "Product Already Exists" });
        }

        const newProduct = new productData({
            name,
            price,
            featured,
            rating,
            company
        });

        await newProduct.validate(); // Validate required fields
        await newProduct.save();

        res.status(201).json({ data: newProduct, message: "Product added successfully" });
    } catch (err) {
        console.error("Error adding product:", err);
        if (err.errors) {
            // Mongoose validation error
            const errorMessages = Object.values(err.errors).map((error) => error.message);
            res.status(400).json({ message: "Validation error", errors: errorMessages });
        } else {
            // Other unexpected errors
            res.status(500).json({ message: "Error adding product", error: err.message });
        }
    }
};

module.exports = { getAllProducts, getAllProductsTesting, updateProduct, addProduct};