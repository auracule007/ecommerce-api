const authController = require('../controllers/authControllers');
const express = require('express');
const router = express.Router();
const { auth } = require("../middleware/auth");


router.post("/api/register", authController.register)
router.post("/api/login", authController.login)
router.get("/api/user", auth,authController.getUser)

module.exports = router;