import { CommitEntity, GraphData, IssueEntity, PullRequestEntity, RepositorySummary } from '../types';

export type EvidenceSourceType = 'commit' | 'pr' | 'issue';

export interface EvidenceSource {
  sourceId: string;
  sourceType: EvidenceSourceType;
  title: string;
  url: string;
  excerpt: string;
}

export interface ExplicitRepositoryRelationship {
  fromSourceId: string;
  toSourceId: string;
  type: 'COMMIT_IN_PULL_REQUEST' | 'PULL_REQUEST_LINKS_ISSUE';
}

export interface TextualMatch {
  sourceId: string;
  title: string;
  url: string;
  matchedTerms: string[];
  score: number;
}

export interface RetrievedCandidate {
  commit: CommitEntity;
  pullRequest: PullRequestEntity;
  issue?: IssueEntity;
  file?: string;
  developer: string;
  relevanceScore: number;
  matchedKeywords: string[];
  explanation: string;
  sourceIds: string[];
}

export interface RetrievedEvidenceBundle {
  query: string;
  extractedKeywords: string[];
  extractedNumbers: number[];
  targetFiles: string[];
  hasSufficientEvidence: boolean;
  confidenceScore: number;
  topCandidate?: RetrievedCandidate;
  allCandidates: RetrievedCandidate[];
  sourceUrls: Array<{ sourceId: string; title: string; url: string; type: EvidenceSourceType }>;
  evidenceSources: EvidenceSource[];
  textualMatches: TextualMatch[];
  explicitRelationships: ExplicitRepositoryRelationship[];
  inferredRelationships: [];
  evidenceExplanation: string;
}

const STOPWORDS = new Set([
  'why', 'is', 'the', 'was', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
  'set', 'added', 'what', 'does', 'did', 'do', 'how', 'when', 'who', 'which', 'this', 'that',
  'with', 'from', 'by', 'it', 'we', 'our', 'code', 'value', 'condition', 'function', 'variable',
  'would', 'could', 'should', 'use', 'using', 'about', 'into', 'behind', 'explain', 'please',
]);

export function extractQueryTokens(question: string): { keywords: string[]; numbers: number[]; targetFiles: string[] } {
  const words = question.toLowerCase().replace(/[?,!;:()"']/g, ' ').split(/\s+/).filter(Boolean);
  const keywords: string[] = [];
  const numbers: number[] = [];
  const targetFiles: string[] = [];

  for (const word of words) {
    if (/^\d+$/.test(word)) numbers.push(Number(word));
    else if (/\.(ts|tsx|js|jsx|py|sql)$/.test(word)) targetFiles.push(word);
    else if (!STOPWORDS.has(word) && word.length >= 2) keywords.push(word);
  }
  return { keywords: [...new Set(keywords)], numbers: [...new Set(numbers)], targetFiles: [...new Set(targetFiles)] };
}

/** Checks that a record's source points to the exact GitHub object in this repository. */
export function validateGitHubSourceUrl(
  summary: RepositorySummary,
  type: EvidenceSourceType,
  recordId: string | number,
  sourceUrl: string,
): boolean {
  if (!summary.owner || !summary.repo || summary.fullName.toLowerCase() !== `${summary.owner}/${summary.repo}`.toLowerCase()) return false;
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || parsed.username || parsed.password || parsed.search || parsed.hash) return false;
    const expectedSuffix = type === 'commit' ? 'commit' : type === 'pr' ? 'pull' : 'issues';
    const recordPath = `/${summary.owner}/${summary.repo}/${expectedSuffix}/${recordId}`;
    const path = parsed.pathname.replace(/\/$/, '');
    if (type === 'commit') {
      const shortHash = String(recordId).slice(0, 7);
      return path.toLowerCase() === recordPath.toLowerCase() || path.toLowerCase() === `/${summary.owner}/${summary.repo}/commit/${shortHash}`.toLowerCase();
    }
    return path.toLowerCase() === recordPath.toLowerCase();
  } catch {
    return false;
  }
}

function validSource(summary: RepositorySummary, type: EvidenceSourceType, id: string | number, url: string): boolean {
  if (type === 'commit' && !/^[a-f\d]{7,40}$/i.test(String(id))) return false;
  if (type !== 'commit' && (!Number.isSafeInteger(Number(id)) || Number(id) < 1)) return false;
  return validateGitHubSourceUrl(summary, type, id, url);
}

function sourceId(type: EvidenceSourceType, id: string | number): string {
  return `${type}:${id}`;
}

function cleanExcerpt(value: string, maxLength = 4000): string {
  return String(value || '').trim().slice(0, maxLength);
}

/**
 * Separates text matches from repository relationships. A relationship is emitted only when
 * the PR's indexed commit SHA or explicitly linked issue number matches an indexed record.
 */
export function retrieveEvidence(
  question: string,
  summary: RepositorySummary,
  commits: CommitEntity[],
  pullRequests: PullRequestEntity[],
  issues: IssueEntity[],
  _graph?: GraphData,
): RetrievedEvidenceBundle {
  const { keywords, numbers, targetFiles } = extractQueryTokens(question);
  const textualMatches: TextualMatch[] = [];
  const explicitRelationships: ExplicitRepositoryRelationship[] = [];
  const evidenceSources: EvidenceSource[] = [];
  const validCommits = commits.filter((commit) => validSource(summary, 'commit', commit.id, commit.url));
  const validPulls = pullRequests.filter((pr) => validSource(summary, 'pr', pr.id, pr.url));
  const validIssues = issues.filter((issue) => validSource(summary, 'issue', issue.id, issue.url));

  const addSource = (type: EvidenceSourceType, id: string | number, title: string, url: string, excerpt: string) => {
    const idValue = sourceId(type, id);
    if (validSource(summary, type, id, url) && !evidenceSources.some((source) => source.sourceId === idValue)) {
      evidenceSources.push({ sourceId: idValue, sourceType: type, title, url, excerpt: cleanExcerpt(excerpt) });
    }
  };

  const termsIn = (text: string): string[] => {
    const haystack = text.toLowerCase();
    const matches = keywords.filter((word) => haystack.includes(word));
    numbers.forEach((number) => {
      if (new RegExp(`\\b${number}\\b`).test(haystack)) matches.push(String(number));
    });
    return [...new Set(matches)];
  };

  for (const commit of validCommits) {
    const excerpt = cleanExcerpt(commit.message);
    const matchedTerms = termsIn(`${commit.message} ${commit.filesChanged.join(' ')}`);
    if (matchedTerms.length) textualMatches.push({ sourceId: sourceId('commit', commit.id), title: `Commit ${commit.shortHash}: ${commit.message.split('\n')[0]}`, url: commit.url, matchedTerms, score: Math.min(100, matchedTerms.length * 20) });
    addSource('commit', commit.id, `Commit ${commit.shortHash}: ${commit.message.split('\n')[0]}`, commit.url, excerpt);
  }
  for (const pr of validPulls) {
    const excerpt = cleanExcerpt(`${pr.title}\n${pr.summary}`);
    const matchedTerms = termsIn(excerpt);
    if (matchedTerms.length) textualMatches.push({ sourceId: sourceId('pr', pr.id), title: `Pull Request #${pr.id}: ${pr.title}`, url: pr.url, matchedTerms, score: Math.min(100, matchedTerms.length * 20) });
    addSource('pr', pr.id, `Pull Request #${pr.id}: ${pr.title}`, pr.url, excerpt);
  }
  for (const issue of validIssues) {
    const excerpt = cleanExcerpt(`${issue.title}\n${issue.description}`);
    const matchedTerms = termsIn(excerpt);
    if (matchedTerms.length) textualMatches.push({ sourceId: sourceId('issue', issue.id), title: `Issue #${issue.id}: ${issue.title}`, url: issue.url, matchedTerms, score: Math.min(100, matchedTerms.length * 20) });
    addSource('issue', issue.id, `Issue #${issue.id}: ${issue.title}`, issue.url, excerpt);
  }

  const issuesById = new Map(validIssues.map((issue) => [issue.id, issue]));
  const commitsById = new Map(validCommits.map((commit) => [commit.id.toLowerCase(), commit]));
  const candidates: RetrievedCandidate[] = [];
  for (const pr of validPulls) {
    const linkedIssue = pr.linkedIssueId === undefined ? undefined : issuesById.get(pr.linkedIssueId);
    if (linkedIssue) {
      explicitRelationships.push({ fromSourceId: sourceId('pr', pr.id), toSourceId: sourceId('issue', linkedIssue.id), type: 'PULL_REQUEST_LINKS_ISSUE' });
    }
    for (const commitId of pr.commitIds || []) {
      const commit = commitsById.get(commitId.toLowerCase());
      if (!commit || !pr.commitIds?.some((id) => id.toLowerCase() === commit.id.toLowerCase())) continue;
      explicitRelationships.push({ fromSourceId: sourceId('commit', commit.id), toSourceId: sourceId('pr', pr.id), type: 'COMMIT_IN_PULL_REQUEST' });
      const rationale = `${pr.summary}\n${linkedIssue?.description || ''}`.trim();
      const rationaleTerms = termsIn(`${pr.title}\n${rationale}\n${commit.message}`);
      const requiredTerms = Math.min(2, keywords.length + numbers.length);
      const hasRationale = rationale.replace(/\s/g, '').length >= 30;
      const hasCausalLanguage = /\b(?:because|since|due to|caus\w*|trigger\w*|prevent\w*|avoid\w*|reduc\w*|address\w*|resolv\w*|fix(?:es|ed)?|lead\w* to|result\w* in|allow\w*|so that|in order to|balance\w*)\b/i.test(rationale);
      if (!hasRationale || !hasCausalLanguage || requiredTerms === 0 || rationaleTerms.length < requiredTerms) continue;

      const sourceIds = [sourceId('commit', commit.id), sourceId('pr', pr.id), ...(linkedIssue ? [sourceId('issue', linkedIssue.id)] : [])];
      const score = Math.max(80, Math.min(100, 80 + (linkedIssue ? 10 : 0) + Math.min(10, rationaleTerms.length * 2)));
      candidates.push({
        commit,
        pullRequest: pr,
        issue: linkedIssue,
        file: commit.filesChanged[0],
        developer: commit.author,
        relevanceScore: score,
        matchedKeywords: rationaleTerms,
        explanation: `Textual matches were found in records explicitly linked by the repository data (${rationaleTerms.join(', ')}).`,
        sourceIds,
      });
    }
  }

  // Drop relationship edges whose endpoints were invalid or absent from the trusted source set.
  const sourceIdSet = new Set(evidenceSources.map((source) => source.sourceId));
  const verifiedRelationships = explicitRelationships.filter((edge) => sourceIdSet.has(edge.fromSourceId) && sourceIdSet.has(edge.toSourceId));
  candidates.sort((left, right) => right.relevanceScore - left.relevanceScore);
  const highestScore = candidates[0]?.relevanceScore;
  const tiedTopCandidates = candidates.filter((candidate) => candidate.relevanceScore === highestScore);
  const ambiguousTopCandidates = tiedTopCandidates.length > 1 && new Set(tiedTopCandidates.map((candidate) => candidate.pullRequest.id)).size > 1;
  const topCandidate = ambiguousTopCandidates
    ? undefined
    : candidates.find((candidate) => candidate.sourceIds.every((id) => sourceIdSet.has(id)));
  const hasSufficientEvidence = Boolean(topCandidate && topCandidate.relevanceScore >= 80);
  const selectedIds = new Set(topCandidate?.sourceIds || []);
  const selectedSources = evidenceSources.filter((source) => selectedIds.has(source.sourceId));
  const selectedRelationships = verifiedRelationships.filter((edge) => selectedIds.has(edge.fromSourceId) && selectedIds.has(edge.toSourceId));
  const sourceUrls = selectedSources.map((source) => ({ sourceId: source.sourceId, title: source.title, url: source.url, type: source.sourceType }));
  const evidenceExplanation = ambiguousTopCandidates
    ? 'Insufficient evidence: multiple explicitly linked pull requests match this question equally. The system will not choose one explanation without distinguishing evidence.'
    : hasSufficientEvidence && topCandidate
    ? `A text match was found and the commit-to-PR relationship was explicitly verified from repository records${topCandidate.issue ? `; the PR-to-issue reference was also explicitly verified` : ''}. The source excerpts are provided verbatim.`
    : `Insufficient evidence: no causal rationale with matching terms was found within source records connected by explicit repository relationships. Textual similarity by itself does not establish a relationship.`;

  return {
    query: question,
    extractedKeywords: keywords,
    extractedNumbers: numbers,
    targetFiles,
    hasSufficientEvidence,
    confidenceScore: hasSufficientEvidence && topCandidate ? Math.max(0, Math.min(100, topCandidate.relevanceScore)) : 0,
    topCandidate: hasSufficientEvidence ? topCandidate : undefined,
    allCandidates: candidates.slice(0, 5),
    sourceUrls: hasSufficientEvidence ? sourceUrls : [],
    evidenceSources: hasSufficientEvidence ? selectedSources : [],
    textualMatches: textualMatches.sort((left, right) => right.score - left.score).slice(0, 50),
    explicitRelationships: hasSufficientEvidence ? selectedRelationships : [],
    inferredRelationships: [],
    evidenceExplanation,
  };
}
