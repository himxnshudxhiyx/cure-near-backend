const express = require('express');
const router = express.Router();

const {getAllProducts, getAllProductsTesting, updateProduct, addProduct} = require("../controllers/product");

router.route('/').get(getAllProducts);
router.route('/testing').get(getAllProductsTesting);
router.route('/update').post(updateProduct); // New route for updating a product using POST
router.route('/add').post(addProduct); // New route for adding a product using POST

module.exports = router;