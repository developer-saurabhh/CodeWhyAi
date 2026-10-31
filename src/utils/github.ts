/**
 * GitHub repository URL parser and validator.
 */

export interface ParsedRepo {
  owner: string;
  repo: string;
  isValid: boolean;
  normalizedUrl: string;
}

export function parseGitHubUrl(input: string): ParsedRepo {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { owner: '', repo: '', isValid: false, normalizedUrl: '' };
  }

  // Support patterns:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // github.com/owner/repo
  // owner/repo
  const cleanInput = trimmed.replace(/\.git\/?$/, '').replace(/\/+$/, '');

  const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;
  const match = cleanInput.match(regex);

  if (match) {
    const owner = match[1];
    const repo = match[2];
    return {
      owner,
      repo,
      isValid: true,
      normalizedUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  // Also support shorthand "owner/repo"
  const shorthandRegex = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;
  const shorthandMatch = cleanInput.match(shorthandRegex);

  if (shorthandMatch) {
    const owner = shorthandMatch[1];
    const repo = shorthandMatch[2];
    return {
      owner,
      repo,
      isValid: true,
      normalizedUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  return { owner: '', repo: '', isValid: false, normalizedUrl: trimmed };
}
