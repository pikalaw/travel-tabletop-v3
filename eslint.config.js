import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

// Module boundaries (technical design, "Architecture"): ui → host (the game controller) → engine;
// the engine reads cards; ui and host may use storage. The engine is pure: it imports only
// engine/ and cards/, and touches no browser API.
const src = './src';
const zone = (target, from, message) => ({ target: `${src}/${target}`, from: from.map((f) => `${src}/${f}`), message });
const boundaries = [
  zone('engine', ['host', 'storage', 'ui'], 'engine/ imports only engine/ and cards/.'),
  zone('cards', ['host', 'storage', 'ui'], 'cards/ imports only cards/ and engine/.'),
  zone('host', ['ui'], 'host/ must not import ui/.'),
  zone('storage', ['host', 'ui'], 'storage/ may import engine/ and cards/ only.'),
];

const browserOnly = ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB', 'crypto', 'fetch',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame', 'Date', 'performance']
  .map((name) => ({ name, message: 'The engine is pure: pass time, randomness and storage in from the host.' }));

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'test-results/', 'playwright-report/', 'docs/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'import-x': importX },
    settings: { 'import-x/resolver-next': [createTypeScriptImportResolver()] },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'import-x/no-restricted-paths': ['error', { zones: boundaries }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },
  {
    files: ['src/engine/**', 'src/cards/**'],
    languageOptions: { globals: {} },
    rules: { 'no-restricted-globals': ['error', ...browserOnly] },
  },
  {
    files: ['*.config.{js,ts}', 'e2e/**', 'tests/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
);
