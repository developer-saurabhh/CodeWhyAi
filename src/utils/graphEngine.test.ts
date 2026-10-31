import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphEngine } from './graphEngine';
import { GraphNode, GraphRelationship } from '../types';

test('GraphEngine indexes nodes and traverses multi-hop evidence chain', () => {
  const nodes: GraphNode[] = [
    { id: 'repo:payment', label: 'payment', type: 'Repo' },
    { id: 'file:gateway.ts', label: 'gateway.ts', type: 'File' },
    { id: 'commit:8f2a1b4', label: '8f2a1b4', type: 'Commit' },
    { id: 'dev:sarah', label: 'Sarah Chen', type: 'Developer' },
    { id: 'pr:42', label: 'PR #42', type: 'PullRequest' },
    { id: 'issue:28', label: 'Issue #28', type: 'Issue' },
  ];

  const rels: GraphRelationship[] = [
    { id: 'r1', source: 'repo:payment', target: 'file:gateway.ts', type: 'REPOSITORY_CONTAINS_FILE' },
    { id: 'r2', source: 'dev:sarah', target: 'commit:8f2a1b4', type: 'DEVELOPER_AUTHORED_COMMIT' },
    { id: 'r3', source: 'commit:8f2a1b4', target: 'file:gateway.ts', type: 'COMMIT_MODIFIES_FILE' },
    { id: 'r4', source: 'pr:42', target: 'commit:8f2a1b4', type: 'PULL_REQUEST_CONTAINS_COMMIT' },
    { id: 'r5', source: 'issue:28', target: 'pr:42', type: 'ISSUE_LINKED_TO_PULL_REQUEST' },
  ];

  const engine = new GraphEngine({ nodes, relationships: rels });

  assert.equal(engine.getAllNodes().length, 6);
  assert.equal(engine.getAllRelationships().length, 5);

  const chain = engine.findEvidenceChainForCommit('commit:8f2a1b4');
  assert.equal(chain.commit?.id, 'commit:8f2a1b4');
  assert.equal(chain.author?.label, 'Sarah Chen');
  assert.equal(chain.files.length, 1);
  assert.equal(chain.files[0].label, 'gateway.ts');
  assert.equal(chain.pullRequest?.id, 'pr:42');
  assert.equal(chain.issues.length, 1);
  assert.equal(chain.issues[0].id, 'issue:28');
});

test('GraphEngine handles commits with no linked PR or issues gracefully', () => {
  const nodes: GraphNode[] = [
    { id: 'commit:solo', label: 'solo commit', type: 'Commit' },
  ];
  const engine = new GraphEngine({ nodes, relationships: [] });
  const chain = engine.findEvidenceChainForCommit('commit:solo');
  assert.equal(chain.commit?.id, 'commit:solo');
  assert.equal(chain.pullRequest, undefined);
  assert.equal(chain.issues.length, 0);
  assert.equal(chain.files.length, 0);
});
