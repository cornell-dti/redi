/**
 * Script to list all prompts and check what match data exists
 */

import { db } from '../firebaseAdmin';

async function listPromptsAndMatches() {
  console.log('🔍 Listing all prompts and matches\n');

  try {
    // List all prompts
    console.log('═══════════════════════════════════════════════════════════');
    console.log('WEEKLY PROMPTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const promptsSnapshot = await db
      .collection('weeklyPrompts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log(`Found ${promptsSnapshot.size} recent prompts:\n`);

    promptsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Prompt ID: ${doc.id}`);
      console.log(`   Question: ${data.question?.substring(0, 60)}...`);
      console.log(`   Status: ${data.status || 'unknown'}`);
      console.log(`   Active: ${data.active}`);
      console.log(`   Created: ${data.createdAt?.toDate().toISOString().split('T')[0]}`);
      console.log('');
    });

    // List some match documents
    console.log('═══════════════════════════════════════════════════════════');
    console.log('WEEKLY MATCHES SAMPLE');
    console.log('═══════════════════════════════════════════════════════════\n');

    const matchesSnapshot = await db
      .collection('weeklyMatches')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log(`Found ${matchesSnapshot.size} recent match documents:\n`);

    matchesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Document ID: ${doc.id}`);
      console.log(`   NetID: ${data.netid}`);
      console.log(`   Prompt ID: ${data.promptId}`);
      console.log(`   Matches: [${data.matches?.join(', ') || 'none'}]`);
      console.log(`   Created: ${data.createdAt?.toDate().toISOString()}`);
      console.log('');
    });

    // Get count of all matches
    const allMatchesSnapshot = await db.collection('weeklyMatches').count().get();
    console.log(`\nTotal match documents in database: ${allMatchesSnapshot.data().count}\n`);

    // Group matches by promptId
    console.log('═══════════════════════════════════════════════════════════');
    console.log('MATCHES BY PROMPT ID');
    console.log('═══════════════════════════════════════════════════════════\n');

    const allMatchesForGrouping = await db
      .collection('weeklyMatches')
      .get();

    const matchesByPrompt = new Map<string, number>();
    allMatchesForGrouping.docs.forEach((doc) => {
      const promptId = doc.data().promptId;
      matchesByPrompt.set(promptId, (matchesByPrompt.get(promptId) || 0) + 1);
    });

    console.log('Matches grouped by prompt ID:\n');
    Array.from(matchesByPrompt.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([promptId, count]) => {
        console.log(`  ${promptId}: ${count} matches`);
      });

    console.log('\n🔍 Listing complete!\n');

  } catch (error) {
    console.error('❌ Error during listing:', error);
    throw error;
  }
}

// Run the script
listPromptsAndMatches()
  .then(() => {
    console.log('Listing script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Listing script failed:', error);
    process.exit(1);
  });
