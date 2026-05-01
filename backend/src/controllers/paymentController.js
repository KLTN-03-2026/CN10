const { verifyMockPaymentForUser } = require("../services/paymentService");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const PRO_PLAN_DEMO_PRICE = Number(process.env.PRO_DEMO_PRICE_USD || 15);
const PRO_PLAN_DEMO_CURRENCY = process.env.PRO_DEMO_CURRENCY || "USD";

const demoCheckout = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized request",
      });
    }

    const transaction = await Transaction.create({
      userId,
      amount: PRO_PLAN_DEMO_PRICE,
      currency: String(PRO_PLAN_DEMO_CURRENCY).toUpperCase(),
      status: "COMPLETED",
    });

    const user = await User.findByIdAndUpdate(
      userId,
      {
        tier: "PRO",
        isFirstLogin: false,
        lastLogin: new Date(),
      },
      { new: true, runValidators: true },
    ).select("_id username avatar role tier isFirstLogin");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Demo checkout completed. Account upgraded to PRO.",
      transaction,
      user,
      redirectUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`,
    });
  } catch (error) {
    console.error("Demo checkout error:", error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to process demo checkout",
    });
  }
};

const mockVerifyPayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const user = await verifyMockPaymentForUser(userId);

    return res.status(200).json({
      success: true,
      message: "Demo payment verified. Account upgraded to PRO.",
      user,
      redirectUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to verify mock payment",
    });
  }
};

module.exports = {
  demoCheckout,
  mockVerifyPayment,
};
