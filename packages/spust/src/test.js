#!/usr/bin/env node
// @flow

process.env.NODE_ENV = 'test';
process.env.BABEL_ENV = 'test';

process.on('unhandledRejection', err => {
  throw err;
});

const jest = require('jest');
const fs = require('fs');
const path = require('path');
const argv = process.argv.slice(2);

if (!process.env.CI && argv.indexOf('--coverage') < 0) {
  argv.push('--watch');
} else {
  argv.push('--forceExit');
}

const setupTestsFile = fs.existsSync(path.resolve(process.cwd(), 'src/setupTests.js'))
  ? '<rootDir>/src/setupTests.js'
  : undefined;

argv.push(
  '--config',
  JSON.stringify({
    collectCoverageFrom: ['src/**/*.{js,jsx}'],
    setupFiles: [path.resolve(__dirname, './polyfills/server.js')],
    setupTestFrameworkScriptFile: setupTestsFile,
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.js?(x)',
      '<rootDir>/src/**/?(*.)(spec|test).js?(x)',
    ],
    testEnvironment: 'node',
    testURL: 'http://localhost',
    transform: {
      '^.+\\.(js|jsx)$': path.resolve(__dirname, 'jest/babelTransform.js'),
      '^.+\\.css$': path.resolve(__dirname, 'jest/cssTransform.js'),
      '^(?!.*\\.(js|jsx|css|json)$)': path.resolve(__dirname, 'jest/fileTransform.js'),
    },
    transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
  }),
);

jest.run(argv);
