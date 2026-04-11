const {
  analyzeWorkflowForUser,
  getHistoryForRequester,
  createAutoFixPullRequest,
} = require("../services/analysisService");

/**
 * POST /api/analysis/analyze
 */
const analyzeWorkflow = async (req, res) => {
  try {
    const { repoUrl, workflowRunId } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const customApiKeyHeader = req.headers["x-gemini-key"];
    const customApiKey = Array.isArray(customApiKeyHeader)
      ? customApiKeyHeader[0]
      : customApiKeyHeader;

    const analysisLog = await analyzeWorkflowForUser({
      repoUrl,
      workflowRunId,
      userId,
      customApiKey,
    });

    return res.status(200).json({
      success: true,
      data: analysisLog,
      message: "Workflow analysis completed",
      severity: analysisLog.severity,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      error: status === 500 ? "Workflow analysis failed" : error.message,
      details: error.details || error.message,
    });
  }
};

/**
 * GET /api/analysis/history
 */
const getHistory = async (req, res) => {
  try {
    const requesterId = req.user?.userId || req.user?.id;
    const requesterRole = req.user?.role;

    const result = await getHistoryForRequester({
      requesterId,
      requesterRole,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      analyses: result.analyses,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      error: status === 500 ? "Failed to fetch analysis history" : error.message,
      details: error.details || error.message,
    });
  }
};

/**
 * POST /api/analysis/:analysisId/create-pr
 */
const createAutoFixPr = async (req, res) => {
  try {
    const analysisId = req.params.analysisId || req.body.analysisId;
    const { filePath } = req.body;
    const userId = req.user?.userId || req.user?.id;

    const result = await createAutoFixPullRequest({
      analysisId,
      filePath,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      pr: result.pr,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      error: status === 500 ? "Failed to create pull request" : error.message,
      details: error.details || error.message,
    });
  }
};

module.exports = {
  analyzeWorkflow,
  getHistory,
  createAutoFixPr,
};
