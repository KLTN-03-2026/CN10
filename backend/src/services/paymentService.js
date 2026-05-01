const User = require("../models/User");

async function verifyMockPaymentForUser(userId) {
  if (!userId) {
    const error = new Error("Unauthorized request");
    error.status = 401;
    throw error;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      tier: "PRO",
      isFirstLogin: false,
      lastLogin: new Date(),
    },
    { new: true, runValidators: true },
  ).select("_id username avatar role tier isFirstLogin");

  if (!updatedUser) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return updatedUser;
}

module.exports = {
  verifyMockPaymentForUser,
};
