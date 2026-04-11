const { GoogleGenerativeAI } = require("@google/generative-ai");

function analyzeWithHeuristics(logs, context = {}) {
  const branchName = context.branchName || "main";
  const isFeatureBranch =
    typeof branchName === "string" &&
    branchName !== "main" &&
    !branchName.startsWith("release/");

  const checks = [
    {
      pattern: /module not found|can't resolve/i,
      rootCause:
        "Build failed because one or more imported modules/packages are missing from dependencies.",
      suggestedFix:
        "Install missing packages and ensure import paths are correct. Then run a clean install and rebuild. Example: npm install <missing-package> && npm run build.",
      severity: "HIGH",
    },
    {
      pattern: /enoent|no such file or directory/i,
      rootCause:
        "The workflow references a file/path that does not exist in the runner environment.",
      suggestedFix:
        "Verify working directory and file paths in workflow steps. Add debug steps: pwd and ls -la before failing command.",
      severity: "HIGH",
    },
    {
      pattern: /permission denied|eacces/i,
      rootCause: "The workflow command failed due to insufficient permissions.",
      suggestedFix:
        "Grant required permissions in workflow/job, check token scopes, and add chmod for executable scripts when needed.",
      severity: "HIGH",
    },
    {
      pattern: /timed out|timeout|exceeded/i,
      rootCause: "The workflow exceeded allowed execution time.",
      suggestedFix:
        "Add dependency caching, reduce job scope, split long tasks, and optimize test/build commands to complete within timeout limits.",
      severity: "MEDIUM",
    },
    {
      pattern: /npm err!|yarn error|pnpm err/i,
      rootCause:
        "Dependency installation or script execution failed in package manager step.",
      suggestedFix:
        "Pin Node version, lock package manager version, clear cache, and use deterministic install command (npm ci / pnpm install --frozen-lockfile).",
      severity: "MEDIUM",
    },
    {
      pattern: /test failed|failing tests|assertionerror/i,
      rootCause: "Workflow failed because one or more tests are failing.",
      suggestedFix:
        "Open test output for first failing test, reproduce locally, and fix flaky tests or environment-dependent assertions.",
      severity: "MEDIUM",
    },
  ];

  const matched = checks.find((item) => item.pattern.test(logs));

  if (matched) {
    const featureBranchHint = isFeatureBranch
      ? " Focus on minimal, reviewable changes suitable for GitHub Flow Pull Request review."
      : "";

    return {
      reasoning_trace:
        "Matched known failure signature from heuristic rule-set.",
      rootCause: matched.rootCause,
      suggestedFix: `${matched.suggestedFix}${featureBranchHint}`,
      targetFile: null,
      severity: matched.severity,
      summary: "Generated using fallback log heuristics.",
    };
  }

  return {
    reasoning_trace:
      "No deterministic pattern match found; returning generalized remediation guidance.",
    rootCause:
      "Unable to determine an exact root cause from logs automatically. The failure appears to be workflow/environment related.",
    suggestedFix: isFeatureBranch
      ? "Inspect the first error stack trace in job logs, apply the smallest safe patch on the feature branch, and prepare a PR-ready fix with clear review notes."
      : "Inspect the first error stack trace in job logs, verify secrets/env vars, pin tool versions, and retry with debug logging enabled.",
    targetFile: null,
    severity: "MEDIUM",
    summary: "Generated using fallback log heuristics.",
  };
}

/**
 * Analyze CI/CD logs using Google Gemini AI
 * @param {string} logs - Raw CI/CD workflow logs
 * @param {string} customApiKey - Optional Gemini API key from user request header
 * @param {Object} context - Workflow context (branchName, prNumber)
 * @returns {Promise<Object>} Structured analysis with rootCause and suggestedFix
 */
const analyzeLogsWithAI = async (logs, customApiKey, context = {}) => {
  try {
    if (!logs || logs.trim().length === 0) {
      throw new Error("Logs cannot be empty");
    }

    const API_KEY_TO_USE = customApiKey || process.env.GEMINI_API_KEY;

    if (!API_KEY_TO_USE) {
      console.warn("⚠ GEMINI_API_KEY not found, using heuristic fallback");
      return analyzeWithHeuristics(logs, context);
    }

    const client = new GoogleGenerativeAI(API_KEY_TO_USE);

    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const branchName = context.branchName || "main";
    const prNumber = context.prNumber || null;
    const isFeatureBranch =
      typeof branchName === "string" &&
      branchName !== "main" &&
      !branchName.startsWith("release/");

    const prompt = `You are an Expert DevSecOps Engineer and CI/CD Pipeline Debugger. 
Analyze the following workflow logs to identify failures.

  GitHub Flow context:
  - branchName: ${branchName}
  - prNumber: ${prNumber || "none"}
  - isFeatureBranch: ${isFeatureBranch ? "yes" : "no"}

  If isFeatureBranch is yes, prioritize recommendations that are minimal, review-friendly, and safe for Pull Request review before merging to main.

CRITICAL INSTRUCTION: You must analyze the logs step-by-step. First, document your investigation in the "reasoning_trace" field. Then, explicitly define the root cause, actionable fix, and severity.

Format your response as a strictly valid JSON object with these exact keys:
{
  "reasoning_trace": "Step-by-step technical analysis of the stack trace and error codes...",
  "rootCause": "Precise identification of the failing component or logic",
  "suggestedFix": "Concrete code snippet or configuration change to resolve the error",
  "targetFile": "Repository-relative file path to modify (e.g. src/index.js), or null if unknown",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "summary": "One-sentence executive summary of the issue"
}

Do NOT include markdown formatting (such as json). Return ONLY the raw JSON object.

Workflow Logs:
${logs}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response (handle potential markdown formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!analysis.rootCause || !analysis.suggestedFix) {
      throw new Error("AI response missing required fields");
    }

    console.log("✅ AI analysis completed successfully");
    return {
      reasoning_trace: analysis.reasoning_trace || "",
      rootCause: analysis.rootCause,
      suggestedFix: analysis.suggestedFix,
      targetFile: analysis.targetFile || null,
      severity: analysis.severity || "MEDIUM",
      summary: analysis.summary || "",
    };
  } catch (error) {
    console.error("Error analyzing logs with AI:", error.message);
    console.warn("⚠ Falling back to heuristic analysis");
    return analyzeWithHeuristics(logs, context);
  }
};

module.exports = {
  analyzeLogsWithAI,
};
