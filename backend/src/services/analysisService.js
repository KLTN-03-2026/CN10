const AnalysisLog = require("../models/AnalysisLog");
const User = require("../models/User");
const {
  fetchFailedWorkflowLogs,
  createBranch,
  commitCode,
  createPullRequest,
} = require("./githubService");
const { analyzeLogsWithAI } = require("./aiService");

const MAX_RAW_SNIPPET_LENGTH = 15000;

function createServiceError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
}

function parseGitHubRepo(repoInput) {
  if (!repoInput || typeof repoInput !== "string") {
    return null;
  }

  const normalized = repoInput
    .trim()
    .replace(/\.git$/, "")
    .replace(/\/+$/, "");

  const fullUrlMatch = normalized.match(
    /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s?#]+)(?:[/?#]|$)/i,
  );
  if (fullUrlMatch) {
    const owner = fullUrlMatch[1];
    const repo = fullUrlMatch[2];
    return { owner, repo, repoFullName: `${owner}/${repo}` };
  }

  const shortFormatMatch = normalized.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (shortFormatMatch) {
    const owner = shortFormatMatch[1];
    const repo = shortFormatMatch[2];
    return { owner, repo, repoFullName: `${owner}/${repo}` };
  }

  return null;
}

function extractRunId(input) {
  if (!input || typeof input !== "string") {
    return null;
  }

  const match = input.match(/\/actions\/runs\/(\d+)/i);
  return match ? match[1] : null;
}

async function analyzeWorkflowForUser({
  repoUrl,
  workflowRunId,
  userId,
  customApiKey,
}) {
  if (!repoUrl) {
    throw createServiceError(400, "repoUrl is required");
  }

  const parsedRepo = parseGitHubRepo(repoUrl);
  if (!parsedRepo) {
    throw createServiceError(
      400,
      "Invalid repository format. Use either https://github.com/owner/repo or owner/repo",
    );
  }

  const { owner, repo, repoFullName } = parsedRepo;
  const effectiveRunId =
    (workflowRunId && String(workflowRunId).trim()) ||
    extractRunId(repoUrl) ||
    "latest";

  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) {
    throw createServiceError(
      401,
      "User not authenticated with GitHub or token missing",
    );
  }

  const analysisLog = new AnalysisLog({
    userId,
    repoFullName,
    runId: String(effectiveRunId),
    rawErrorSnippet: "Collecting workflow logs...",
    aiResult: {
      rootCause: "Analyzing logs...",
      suggestedFix: "Please wait while we generate a fix suggestion...",
    },
    branchName: "main",
    status: "PENDING",
  });
  await analysisLog.save();

  try {
    const workflowData = await fetchFailedWorkflowLogs(
      owner,
      repo,
      effectiveRunId,
      user.githubAccessToken,
    );

    analysisLog.rawErrorSnippet = (workflowData.logs || "").slice(
      0,
      MAX_RAW_SNIPPET_LENGTH,
    );
    analysisLog.branchName = workflowData.branchName || "main";
    analysisLog.prNumber = workflowData.prNumber || null;

    const aiAnalysis = await analyzeLogsWithAI(workflowData.logs || "", customApiKey, {
      branchName: analysisLog.branchName,
      prNumber: analysisLog.prNumber,
    });

    analysisLog.aiResult = {
      rootCause: aiAnalysis.rootCause,
      suggestedFix: aiAnalysis.suggestedFix,
    };
    analysisLog.reasoning_trace = aiAnalysis.reasoning_trace || null;
    analysisLog.targetFile = aiAnalysis.targetFile || null;
    analysisLog.severity = aiAnalysis.severity || "MEDIUM";
    analysisLog.status = "COMPLETED";
    await analysisLog.save();

    return analysisLog;
  } catch (error) {
    analysisLog.status = "FAILED";
    analysisLog.errorMessage = error.message;
    await analysisLog.save();

    if (error.status) {
      throw error;
    }

    throw createServiceError(500, "Workflow analysis failed", error.message);
  }
}

async function getHistoryForRequester({ requesterId, requesterRole, page, limit }) {
  if (!requesterId || !requesterRole) {
    throw createServiceError(401, "Unauthorized request");
  }

  const safePage = parseInt(page, 10) || 1;
  const safeLimit = parseInt(limit, 10) || 10;
  const skip = (safePage - 1) * safeLimit;

  const query = requesterRole === "ADMIN" ? {} : { userId: requesterId };

  let findQuery = AnalysisLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit);

  if (requesterRole === "ADMIN") {
    findQuery = findQuery.populate("userId", "_id username githubId avatar role");
  }

  const logs = await findQuery.lean();
  const total = await AnalysisLog.countDocuments(query);

  return {
    analyses: logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

async function createAutoFixPullRequest({ analysisId, filePath, userId }) {
  if (!analysisId) {
    throw createServiceError(400, "analysisId is required");
  }

  if (!filePath) {
    throw createServiceError(400, "filePath is required");
  }

  const analysisLog = await AnalysisLog.findById(analysisId);
  if (!analysisLog) {
    throw createServiceError(404, "Analysis log not found");
  }

  if (analysisLog.userId.toString() !== userId) {
    throw createServiceError(403, "Unauthorized: Analysis does not belong to user");
  }

  if (analysisLog.status !== "COMPLETED") {
    throw createServiceError(400, "Analysis must be completed before creating PR");
  }

  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) {
    throw createServiceError(401, "User GitHub token not found");
  }

  const parsedRepo = parseGitHubRepo(analysisLog.repoFullName);
  if (!parsedRepo) {
    throw createServiceError(400, "Invalid repo URL format");
  }

  const { owner, repo } = parsedRepo;
  const timestamp = Date.now();
  const featureBranchName = `autofix-cicd-${timestamp}`;

  try {
    await createBranch(owner, repo, featureBranchName, "main", user.githubAccessToken);

    const rootCause = analysisLog.aiResult?.rootCause || "CI/CD issue";
    const suggestedFix = analysisLog.aiResult?.suggestedFix || "";
    const commitMessage = `🤖 Auto-fix: ${rootCause.substring(0, 50)}...`;

    await commitCode(
      owner,
      repo,
      featureBranchName,
      filePath,
      suggestedFix,
      commitMessage,
      user.githubAccessToken,
    );

    const prBody = `## AI-Generated Fix

**Root Cause:**
${rootCause}

**Suggested Fix:**
\`\`\`
${suggestedFix}
\`\`\`

**File Modified:** ${filePath}

---
*Auto-generated by AI CI/CD Analyzer*`;

    const pr = await createPullRequest(
      owner,
      repo,
      featureBranchName,
      "main",
      `[CICD-Analyzer] Fix: ${rootCause.substring(0, 40)}...`,
      prBody,
      user.githubAccessToken,
    );

    analysisLog.prUrl = pr.prUrl;
    analysisLog.prNumber = pr.prNumber || null;
    analysisLog.status = "PR_CREATED";
    await analysisLog.save();

    return {
      message: "Pull request created successfully",
      pr: {
        number: pr.prNumber,
        url: pr.prUrl,
        branch: featureBranchName,
      },
    };
  } catch (error) {
    analysisLog.status = "FAILED";
    analysisLog.errorMessage = `PR creation failed: ${error.message}`;
    await analysisLog.save();

    throw createServiceError(500, "Failed to create pull request", error.message);
  }
}

module.exports = {
  analyzeWorkflowForUser,
  getHistoryForRequester,
  createAutoFixPullRequest,
};
