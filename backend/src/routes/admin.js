const express = require("express");
const { auth, isAdmin } = require("../middleware/auth");
const {
  getAdminHistory,
  getAdminUsers,
  updateUserRole,
  getFeedbackTickets,
  resolveFeedbackTicket,
  syncAiKnowledge,
} = require("../controllers/adminController");

const router = express.Router();

router.use(auth, isAdmin);

/**
 * GET /api/admin/history
 * Fetch all analysis records with populated user context.
 */
router.get("/history", getAdminHistory);

/**
 * GET /api/admin/users
 * Fetch all users.
 */
router.get("/users", getAdminUsers);

/**
 * PUT /api/admin/users/:id/role
 * Update user role to USER or ADMIN.
 */
router.put("/users/:id/role", updateUserRole);

/**
 * GET /api/admin/feedback
 * Fetch all feedback tickets.
 */
router.get("/feedback", getFeedbackTickets);

/**
 * PUT /api/admin/feedback/:id/resolve
 * Resolve feedback and persist admin reply.
 */
router.put("/feedback/:id/resolve", resolveFeedbackTicket);

/**
 * POST /api/admin/sync-ai
 * Trigger mock AI synchronization process.
 */
router.post("/sync-ai", syncAiKnowledge);

/**
 * Compatibility aliases for existing frontend clients.
 */
router.get("/feedbacks", getFeedbackTickets);
router.put("/feedbacks/:id/resolve", resolveFeedbackTicket);
router.post("/ai/sync-knowledge", syncAiKnowledge);

module.exports = router;
