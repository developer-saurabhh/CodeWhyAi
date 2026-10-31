import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubUrl } from './github';

test('parseGitHubUrl correctly parses standard https URL', () => {
  const result = parseGitHubUrl('https://github.com/facebook/react');
  assert.equal(result.isValid, true);
  assert.equal(result.owner, 'facebook');
  assert.equal(result.repo, 'react');
  assert.equal(result.normalizedUrl, 'https://github.com/facebook/react');
});

test('parseGitHubUrl correctly parses .git URL and trailing slash', () => {
  const result = parseGitHubUrl('https://github.com/torvalds/linux.git/');
  assert.equal(result.isValid, true);
  assert.equal(result.owner, 'torvalds');
  assert.equal(result.repo, 'linux');
});

test('parseGitHubUrl parses shorthand owner/repo', () => {
  const result = parseGitHubUrl('vercel/next.js');
  assert.equal(result.isValid, true);
  assert.equal(result.owner, 'vercel');
  assert.equal(result.repo, 'next.js');
});

test('parseGitHubUrl rejects invalid URLs', () => {
  const result = parseGitHubUrl('not-a-repo');
  assert.equal(result.isValid, false);
});
