import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { HistoryPage } from './HistoryPage';
import { RepositoryPage } from './RepositoryPage';
import { AskAIPage } from './AskAIPage';
import { DEMO_PAYMENT_REPO } from '../../mock/demoData';

test('HistoryPage renders normalized commit id, date and link fields without crashing', () => {
  const markup = renderToStaticMarkup(
    <HistoryPage repoPackage={DEMO_PAYMENT_REPO} onNavigate={() => {}} />,
  );
  assert.ok(markup.includes('8f2a1b4'));
  assert.ok(markup.includes('2026'));
  assert.ok(markup.includes('https://github.com/codewhy-ai/demo-payment-service/commit/8f2a1b4'));
});

test('RepositoryPage uses the normalized repository URL and labels live source inspection honestly', () => {
  const markup = renderToStaticMarkup(
    <RepositoryPage repoPackage={DEMO_PAYMENT_REPO} mode="live" onAskFromCode={() => {}} onNavigate={() => {}} />,
  );
  assert.ok(markup.includes('href="https://github.com/codewhy-ai/demo-payment-service"'));
  assert.ok(markup.includes('Live source files are not fetched by this prototype'));
});

test('AskAIPage does not claim Gemini before the backend returns its actual provider', () => {
  const markup = renderToStaticMarkup(
    <AskAIPage repoPackage={DEMO_PAYMENT_REPO} mode="demo" onNavigate={() => {}} />,
  );
  assert.ok(markup.includes('Evidence-Grounded Answers'));
  assert.ok(markup.includes('Awaiting answer provider'));
  assert.ok(!markup.includes('Model: Google Gemini 2.5 Flash'));
});
