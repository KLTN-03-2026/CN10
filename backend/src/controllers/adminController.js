const mongoose = require("mongoose");
const User = require("../models/User");
const AnalysisLog = require("../models/AnalysisLog");
const Feedback = require("../models/Feedback");

const normalizePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * GET /api/admin/history
 * Fetch all analysis records across the entire system.
 */
const getAdminHistory = async (req, res) => {
  try {
    const { page, limit, skip } = normalizePagination(req.query);

    const [history, total] = await Promise.all([
      AnalysisLog.find({})
        .populate("userId", "username githubId avatar role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalysisLog.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin history:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin history",
      details: error.message,
    });
  }
};

/**
 * GET /api/admin/users
 * Fetch all users.
 */
const getAdminUsers = async (req, res) => {
  try {
    const { page, limit, skip } = normalizePagination(req.query);

    const [users, total] = await Promise.all([
      User.find({})
        .select("_id username githubId avatar role createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      details: error.message,
    });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Update role with { role: "USER" | "ADMIN" }.
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user id",
      });
    }

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
        message: "Role must be either USER or ADMIN",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    )
      .select("_id username githubId avatar role createdAt updatedAt")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update user role",
      details: error.message,
    });
  }
};

/**
 * GET /api/admin/feedback
 * Fetch all feedback tickets with populated user.
 */
const getFeedbackTickets = async (req, res) => {
  try {
    const { page, limit, skip } = normalizePagination(req.query);

    const [feedback, total] = await Promise.all([
      Feedback.find({})
        .populate("userId", "username githubId avatar role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching feedback tickets:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch feedback tickets",
      details: error.message,
    });
  }
};

/**
 * PUT /api/admin/feedback/:id/resolve
 * Resolve ticket and save admin reply.
 */
const resolveFeedbackTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid feedback id",
      });
    }

    if (typeof adminReply !== "string" || !adminReply.trim()) {
      return res.status(400).json({
        success: false,
        error: "adminReply is required",
      });
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      {
        status: "RESOLVED",
        adminReply: adminReply.trim(),
      },
      { new: true, runValidators: true },
    )
      .populate("userId", "username githubId avatar role")
      .lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Feedback ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      feedback: updated,
    });
  } catch (error) {
    console.error("Error resolving feedback ticket:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to resolve feedback ticket",
      details: error.message,
    });
  }
};

/**
 * POST /api/admin/sync-ai
 * Mock RAG synchronization with 2-second delay.
 */
const syncAiKnowledge = async (req, res) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const totalLogs = await AnalysisLog.countDocuments({});

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${totalLogs} logs to the Vector Store.`,
    });
  } catch (error) {
    console.error("Error synchronizing AI knowledge:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to synchronize AI knowledge",
      details: error.message,
    });
  }
};

/**
 * Backward-compatible exports used by older routes.
 */
const getSystemStats = async (req, res) => {
  try {
    const [users, admins, totalAnalyses] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "ADMIN" }),
      AnalysisLog.countDocuments({}),
    ]);

    const analysesByStatus = await AnalysisLog.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap = analysesByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      users,
      admins,
      totalAnalyses,
      analysesByStatus: statusMap,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch system statistics",
      details: error.message,
    });
  }
};

const getGlobalLogs = async (req, res) => {
  try {
    const { page, limit, skip } = normalizePagination(req.query);
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [logs, total] = await Promise.all([
      AnalysisLog.find(filter)
        .populate("userId", "username githubId avatar role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalysisLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch global logs",
      details: error.message,
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = normalizePagination(req.query);
    const filter = {};

    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      filter.userId = req.query.userId;
    }

    const [logs, total] = await Promise.all([
      AnalysisLog.find(filter)
        .populate("userId", "username githubId avatar role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalysisLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
      details: error.message,
    });
  }
};

module.exports = {
  getAdminHistory,
  getAdminUsers,
  updateUserRole,
  getFeedbackTickets,
  resolveFeedbackTicket,
  syncAiKnowledge,
  getSystemStats,
  getGlobalLogs,
  getAuditLogs,
};
