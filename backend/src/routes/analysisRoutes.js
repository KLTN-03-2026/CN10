const express = require("express");
const router = express.Router();
const {
  analyzeWorkflow,
  getHistory,
  createAutoFixPr,
} = require("../controllers/analysisController");
const { auth } = require("../middleware/auth");

/**
 * @route POST /api/analysis/analyze
 * @headers Authorization: Bearer <token>
 * @body {string} repoUrl - GitHub repository URL
 * @body {string} workflowRunId - (optional) Workflow run ID
 * @returns {object} Analysis result with rootCause and suggestedFix
 */
router.post("/analyze", auth, analyzeWorkflow);

/**
 * @route GET /api/analyses
 * @headers Authorization: Bearer <token>
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 10)
 * @returns {array} Role-scoped analysis history
 */
router.get("/", auth, getHistory);

/**
 * @route GET /api/analysis/history
 * @headers Authorization: Bearer <token>
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 10)
 * @returns {array} User's analysis history
 */
router.get("/history", auth, getHistory);

/**
 * @route POST /api/analysis/:analysisId/create-pr
 * @headers Authorization: Bearer <token>
 * @body {string} filePath - Path to file to fix
 * @returns {object} Created PR details (number, url, branch)
 */
router.post("/:analysisId/create-pr", auth, createAutoFixPr);
router.post("/auto-fix", auth, createAutoFixPr);

module.exports = router;
