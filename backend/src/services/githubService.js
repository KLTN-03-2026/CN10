const axios = require("axios");
const readline = require("readline");

const GITHUB_API_BASE = "https://api.github.com";

const GITHUB_HEADERS = (accessToken) => ({
  Authorization: `token ${accessToken}`,
  Accept: "application/vnd.github.v3+json",
});

const resolveRunId = async (owner, repo, runId, accessToken) => {
  if (runId && runId !== "latest") {
    return String(runId);
  }

  const runsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs?status=completed&per_page=20`;
  const runsResponse = await axios.get(runsUrl, {
    headers: GITHUB_HEADERS(accessToken),
  });

  const runs = runsResponse.data?.workflow_runs || [];
  if (runs.length === 0) {
    throw new Error("No completed workflow runs found for this repository");
  }

  const failedRun = runs.find((run) => run.conclusion === "failure");
  const selectedRun = failedRun || runs[0];

  return String(selectedRun.id);
};

/**
 * Fetch failed workflow logs from GitHub Actions
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} runId - Workflow run ID
 * @param {string} accessToken - GitHub personal access token
 * @returns {Promise<Object>} Workflow context + raw logs
 */
const fetchFailedWorkflowLogs = async (owner, repo, runId, accessToken) => {
  try {
    const effectiveRunId = await resolveRunId(owner, repo, runId, accessToken);

    // Get workflow run details
    const runUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs/${effectiveRunId}`;
    const runResponse = await axios.get(runUrl, {
      headers: GITHUB_HEADERS(accessToken),
    });

    if (runResponse.data.status !== "completed") {
      throw new Error("Workflow run is still in progress");
    }

    // Get job details
    const jobsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs/${effectiveRunId}/jobs`;
    const jobsResponse = await axios.get(jobsUrl, {
      headers: GITHUB_HEADERS(accessToken),
    });

    // Find failed jobs
    const failedJobs = jobsResponse.data.jobs.filter(
      (job) => job.conclusion === "failure",
    );

    if (failedJobs.length === 0) {
      throw new Error("No failed jobs found in this workflow run");
    }

    const branchName = runResponse.data?.head_branch || "main";
    const prNumber = Array.isArray(runResponse.data?.pull_requests)
      ? runResponse.data.pull_requests[0]?.number || null
      : null;

    // Fetch logs for each failed job
    let combinedLogs = "";
    for (const job of failedJobs) {
      const logsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
      const logsResponse = await axios.get(logsUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3.raw",
        },
      });
      combinedLogs += `\n\n=== Job: ${job.name} ===\n${logsResponse.data}`;
    }

    console.log(`✅ Fetched logs for workflow run ${effectiveRunId}`);
    return {
      logs: combinedLogs,
      effectiveRunId,
      branchName,
      prNumber,
    };
  } catch (error) {
    const githubMessage =
      error.response?.data?.message || error.response?.data?.error;
    const details = githubMessage ? ` (${githubMessage})` : "";
    console.error("Error fetching GitHub logs:", error.message, details);
    throw new Error(
      `Failed to fetch workflow logs: ${error.message}${details}`,
    );
  }
};

/**
 * Create a new branch in the repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branchName - New branch name
 * @param {string} baseBranch - Base branch to create from (default: main)
 * @param {string} accessToken - GitHub personal access token
 * @returns {Promise<Object>} Branch creation response
 */
const createBranch = async (
  owner,
  repo,
  branchName,
  baseBranch = "main",
  accessToken,
) => {
  try {
    // Get the SHA of the base branch
    const baseRef = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`;
    const baseResponse = await axios.get(baseRef, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const baseSha = baseResponse.data.object.sha;

    // Create new branch
    const refUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`;
    const response = await axios.post(
      refUrl,
      {
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    console.log(`✅ Created branch: ${branchName}`);
    return response.data;
  } catch (error) {
    console.error("Error creating branch:", error.message);
    throw new Error(`Failed to create branch: ${error.message}`);
  }
};

/**
 * Commit code to a branch
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} filePath - Path to the file to commit
 * @param {string} fileContent - Content to write to the file
 * @param {string} commitMessage - Commit message
 * @param {string} accessToken - GitHub personal access token
 * @returns {Promise<Object>} Commit response
 */
const commitCode = async (
  owner,
  repo,
  branch,
  filePath,
  fileContent,
  commitMessage,
  accessToken,
) => {
  try {
    // Get current file SHA (if it exists)
    let fileSha = null;
    try {
      const fileUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const fileResponse = await axios.get(fileUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      fileSha = fileResponse.data.sha;
    } catch (err) {
      // File doesn't exist yet, which is fine
    }

    // Create/update file
    const contentUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`;
    const payload = {
      message: commitMessage,
      content: Buffer.from(fileContent).toString("base64"),
      branch: branch,
    };

    if (fileSha) {
      payload.sha = fileSha;
    }

    const response = await axios.put(contentUrl, payload, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    console.log(`✅ Committed to ${filePath} on branch ${branch}`);
    return response.data;
  } catch (error) {
    console.error("Error committing code:", error.message);
    throw new Error(`Failed to commit code: ${error.message}`);
  }
};

/**
 * Create a Pull Request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} headBranch - Branch with changes (without repo: prefix)
 * @param {string} baseBranch - Target branch (default: main)
 * @param {string} title - PR title
 * @param {string} body - PR description
 * @param {string} accessToken - GitHub personal access token
 * @returns {Promise<Object>} PR creation response
 */
const createPullRequest = async (
  owner,
  repo,
  headBranch,
  baseBranch = "main",
  title,
  body,
  accessToken,
) => {
  try {
    const prsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`;
    const response = await axios.post(
      prsUrl,
      {
        title: title,
        body: body,
        head: headBranch,
        base: baseBranch,
      },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    console.log(`✅ Created PR #${response.data.number}`);
    return {
      prNumber: response.data.number,
      prUrl: response.data.html_url,
      ...response.data,
    };
  } catch (error) {
    console.error("Error creating PR:", error.message);
    throw new Error(`Failed to create PR: ${error.message}`);
  }
};

module.exports = {
  fetchFailedWorkflowLogs,
  createBranch,
  commitCode,
  createPullRequest,
};
