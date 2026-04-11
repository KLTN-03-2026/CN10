const User = require("../models/User");
const Feedback = require("../models/Feedback");

/**
 * Update current user settings
 * @route PUT /api/users/settings
 * @headers Authorization: Bearer <token>
 * @body {string} username
 */
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({
        error: "username is required",
      });
    }

    const normalizedUsername = username.trim();
    if (normalizedUsername.length < 2 || normalizedUsername.length > 40) {
      return res.status(400).json({
        error: "username must be between 2 and 40 characters",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: normalizedUsername },
      { new: true, runValidators: true },
    ).select("_id username avatar role githubId createdAt updatedAt");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        githubId: updatedUser.githubId,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error.message);
    return res.status(500).json({
      error: "Failed to update user settings",
      details: error.message,
    });
  }
};

/**
 * Submit user feedback
 * @route POST /api/feedback
 * @headers Authorization: Bearer <token>
 * @body {string} message
 */
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: "User context is missing",
      });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "message is required",
      });
    }

    const normalizedMessage = message.trim();
    if (normalizedMessage.length < 3 || normalizedMessage.length > 5000) {
      return res.status(400).json({
        error: "message must be between 3 and 5000 characters",
      });
    }

    const feedback = await Feedback.create({
      userId,
      message: normalizedMessage,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: {
        id: feedback._id,
        userId: feedback.userId,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error.message);
    return res.status(500).json({
      error: "Failed to submit feedback",
      details: error.message,
    });
  }
};

module.exports = {
  updateUserSettings,
  submitFeedback,
};
