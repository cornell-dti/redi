/**
 * Manual Test Data Cleanup Script
 *
 * Run this script to manually clean up all test data from Firestore.
 * Useful for cleaning up after failed tests or manual testing.
 *
 * Usage:
 *   npx ts-node src/__tests__/utils/cleanupTestData.ts
 */

import { cleanupTestData } from './testDataGenerator';

async function main() {
  console.log('====================================');
  console.log('TEST DATA CLEANUP SCRIPT');
  console.log('====================================');
  console.log('');
  console.log('This will delete ALL test data from Firestore.');
  console.log('Test data is identified by prefixes:');
  console.log('  - Users: testuser-*');
  console.log('  - Prompts: TEST-2025-W*');
  console.log('');
  console.log('Starting cleanup in 3 seconds...');
  console.log('');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    await cleanupTestData();
    console.log('');
    console.log('✅ Cleanup completed successfully!');
    console.log('====================================');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Cleanup failed with error:');
    console.error(error);
    console.log('====================================');
    process.exit(1);
  }
}

main();
