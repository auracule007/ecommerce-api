const express = require('express');
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { auth, admin } = require('../middleware/auth');

// Category router
router.post("/api/category", categoryController.createCategory);
router.get("/api/category", categoryController.getAllCategory)

module.exports = router;