const Documentation = require("../models/Documentation");

/**
 * GET /api/docs
 * Public endpoint returning documentation sections sorted by order.
 */
const getDocumentationSections = async (req, res) => {
  try {
    const docs = await Documentation.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      docs,
    });
  } catch (error) {
    console.error("Error fetching documentation:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch documentation",
      details: error.message,
    });
  }
};

/**
 * PUT /api/admin/docs/:sectionId
 * Admin-only endpoint to update (or create) documentation by sectionId.
 */
const upsertDocumentationSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, content, icon, order } = req.body;

    if (!sectionId || !sectionId.trim()) {
      return res.status(400).json({
        success: false,
        error: "sectionId is required",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: "content is required",
      });
    }

    const updatePayload = {
      content: content.trim(),
    };

    if (typeof title === "string" && title.trim()) {
      updatePayload.title = title.trim();
    }

    if (typeof icon === "string") {
      updatePayload.icon = icon.trim() || "📘";
    }

    if (typeof order === "number" && Number.isFinite(order)) {
      updatePayload.order = order;
    }

    const doc = await Documentation.findOneAndUpdate(
      { sectionId: sectionId.trim() },
      {
        $set: updatePayload,
        $setOnInsert: {
          sectionId: sectionId.trim(),
          title: updatePayload.title || sectionId.trim(),
          order: updatePayload.order ?? 0,
          icon: updatePayload.icon || "📘",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      doc,
    });
  } catch (error) {
    console.error("Error updating documentation:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update documentation",
      details: error.message,
    });
  }
};

module.exports = {
  getDocumentationSections,
  upsertDocumentationSection,
};
