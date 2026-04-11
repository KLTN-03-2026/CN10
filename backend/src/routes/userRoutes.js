const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { updateUserSettings } = require("../controllers/userController");

/**
 * @route PUT /api/users/settings
 * @headers Authorization: Bearer <token>
 * @body {string} username
 * @returns {object} updated user
 */
router.put("/settings", auth, updateUserSettings);

module.exports = router;
