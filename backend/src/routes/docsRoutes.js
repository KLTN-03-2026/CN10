const express = require("express");
const { auth, isAdmin } = require("../middleware/auth");
const {
  getDocumentationSections,
  upsertDocumentationSection,
} = require("../controllers/docsController");

const router = express.Router();

/**
 * Public docs feed.
 * GET /api/docs
 */
router.get("/", getDocumentationSections);

/**
 * Admin-only docs section upsert.
 * PUT /api/admin/docs/:sectionId
 */
router.put("/:sectionId", auth, isAdmin, upsertDocumentationSection);

module.exports = router;
