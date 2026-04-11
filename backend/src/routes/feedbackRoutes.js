const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { submitFeedback } = require("../controllers/userController");

/**
 * @route POST /api/feedback
 * @headers Authorization: Bearer <token>
 * @body {string} message
 * @returns {object} created feedback info
 */
router.post("/", auth, submitFeedback);

module.exports = router;
