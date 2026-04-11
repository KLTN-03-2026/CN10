const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios"); // Thêm thư viện này để gọi API

/**
 * GitHub OAuth Callback Handler (Bảo mật chuẩn DevSecOps)
 * @route POST /api/auth/github/callback
 * @body {string} code - GitHub authorization code từ Frontend
 */
const handleGitHubCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ error: "Missing GitHub authorization code" });
    }

    // Bước 1: Backend tự mang "code" đi đổi lấy "access_token" từ GitHub
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Invalid code or GitHub API error" });
    }

    // Bước 2: Dùng access_token đó gọi API lấy thông tin Profile thật của user
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Dữ liệu SẠCH 100% lấy trực tiếp từ máy chủ GitHub
    const githubData = userResponse.data;

    // Bước 3: Find or create user trong MongoDB
    let user = await User.findOne({ githubId: githubData.id.toString() });

    if (user) {
      user.githubAccessToken = accessToken;
      user.lastLogin = new Date();
      user.avatar = githubData.avatar_url;
      user.username = githubData.login;
    } else {
      user = new User({
        githubId: githubData.id.toString(),
        username: githubData.login,
        avatar: githubData.avatar_url,
        githubAccessToken: accessToken,
        role: "USER", // Mặc định role
        lastLogin: new Date(),
      });
    }

    await user.save();
    console.log(`✅ User ${user.username} authenticated securely`);

    // Bước 4: Tạo JWT nội bộ
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "❌ GitHub callback error:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "GitHub authentication failed securely" });
  }
};

/**
 * Get Current User Profile
 * @route GET /api/auth/profile
 * @headers Authorization: Bearer <token>
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-githubAccessToken",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({
      error: "Failed to fetch user profile",
    });
  }
};

module.exports = {
  handleGitHubCallback,
  getUserProfile,
};
