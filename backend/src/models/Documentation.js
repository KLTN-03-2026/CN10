const mongoose = require("mongoose");

const DocumentationSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "📘",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "documentation_sections",
  },
);

module.exports = mongoose.model("Documentation", DocumentationSchema);
