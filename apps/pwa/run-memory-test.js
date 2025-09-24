#!/usr/bin/env node

/**
 * Node.js runner for Supermemory performance test
 * Run with: node run-memory-test.js
 */

// Load environment variables from .env file
require('dotenv').config();

// Set up module aliases to handle TypeScript imports
require('module-alias/register');

// Mock browser environment variables
global.import = {
  meta: {
    env: {
      VITE_SUPERMEMORY_API_KEY: process.env.VITE_SUPERMEMORY_API_KEY,
      DEV: true
    }
  }
};

// Use tsx or ts-node to handle TypeScript
const { execSync } = require('child_process');

console.log('🚀 Running Supermemory Performance Test...\n');

try {
  // Check if API key is set
  if (!process.env.VITE_SUPERMEMORY_API_KEY) {
    console.error('❌ Error: VITE_SUPERMEMORY_API_KEY not set in .env file');
    process.exit(1);
  }

  // Run the test using tsx (TypeScript executor)
  execSync('npx tsx src/modules/supermemory/test-memory-performance.ts', {
    stdio: 'inherit',
    cwd: __dirname
  });
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}
