const express = require("express");
const router = express.Router();
const {
  handleGitHubCallback,
  getUserProfile,
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

/**
 * @route POST /api/auth/github/callback
 * @body {string} githubId - GitHub user ID
 * @body {string} username - GitHub username
 * @body {string} avatar - GitHub avatar URL
 * @body {string} accessToken - GitHub access token
 * @returns {string} JWT token for subsequent authenticated requests
 */
router.post("/github/callback", handleGitHubCallback);

/**
 * @route GET /api/auth/profile
 * @headers Authorization: Bearer <token>
 * @returns {object} Current user profile
 */
router.get("/profile", auth, getUserProfile);

module.exports = router;
