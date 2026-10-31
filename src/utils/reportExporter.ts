import { QAResult } from '../types';

/**
 * Generates an Architecture Decision Record (ADR) in Markdown format
 * from CodeWhy AI's grounded findings.
 */
export function generateMarkdownReport(
  repoFullName: string,
  results: QAResult[]
): string {
  const timestamp = new Date().toISOString().split('T')[0];

  const header = [
    `# CodeWhy AI — Architecture Decision & Code Rationale Report`,
    `**Repository:** \`${repoFullName}\``,
    `**Generated Date:** ${timestamp}`,
    `**Engine:** CodeWhy AI server-side evidence retrieval`,
    `**Theme:** HackFront India 2026 — AI & Developer Tools`,
    ``,
    `---`,
    ``,
    `## Executive Summary`,
    `This report documents the historical reasoning, bug fixes, and pull request discussions`,
    `discovered for code configurations and architectural decisions in \`${repoFullName}\`.`,
    `Evidence status is reported per answer. Source excerpts and links are limited to retrieved repository records.`,
    ``,
  ].join('\n');

  if (results.length === 0) {
    return `${header}\n*No questions investigated yet in this session.*`;
  }

  const sections = results.map((res, index) => {
    const statusEmoji =
      res.evidenceStatus === 'Verified'
        ? '✅ Verified'
        : res.evidenceStatus === 'Partially Supported'
        ? '⚠️ Partially Supported'
        : '❌ Insufficient Evidence';

    const commitAuthor = res.supportingEntities.commit?.author || 'Unknown';
    const commitDate = res.supportingEntities.commit?.date ? new Date(res.supportingEntities.commit.date).toLocaleDateString() : '';
    const commitLine = res.supportingEntities.commit
      ? `- **Commit:** [\`${res.supportingEntities.commit.shortHash}\`](${res.supportingEntities.commit.url}) — *${res.supportingEntities.commit.message}* (by ${commitAuthor}${commitDate ? ` on ${commitDate}` : ''})`
      : `- **Commit:** *None found*`;

    const prNum = res.supportingEntities.pullRequest?.id;
    const prLine = res.supportingEntities.pullRequest
      ? `- **Pull Request:** [PR #${prNum}: ${res.supportingEntities.pullRequest.title}](${res.supportingEntities.pullRequest.url})`
      : `- **Pull Request:** *None linked*`;

    const issueNum = res.supportingEntities.issue?.id;
    const issueLine = res.supportingEntities.issue
      ? `- **Related Issue:** [Issue #${issueNum}: ${res.supportingEntities.issue.title}](${res.supportingEntities.issue.url})`
      : `- **Related Issue:** *None linked*`;

    const fileLine = res.supportingEntities.file
      ? `- **Target File:** \`${res.supportingEntities.file}\``
      : ``;

    return [
      `### Decision ${index + 1}: ${res.question}`,
      ``,
      `**Evidence Status:** ${statusEmoji} (${res.confidenceScore}% Confidence)`,
      ``,
      `#### 1. Direct Rationale`,
      `> ${res.shortAnswer}`,
      ``,
      `#### 2. Historical Context & Backstory`,
      res.detailedReasoning,
      ``,
      `#### 3. Verified Historical Triplet`,
      commitLine,
      prLine,
      issueLine,
      fileLine,
      ``,
      `---`,
    ].filter(Boolean).join('\n');
  });

  return `${header}\n${sections.join('\n\n')}`;
}
