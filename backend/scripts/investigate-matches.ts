/**
 * Script to investigate match generation bugs for 2025_46 prompt
 *
 * This script:
 * 1. Queries all matches for the 2025_46 prompt
 * 2. Identifies users with null matches
 * 3. Checks for non-mutual matches
 * 4. Generates a comprehensive report
 */

import { db } from '../firebaseAdmin';

interface MatchDoc {
  netid: string;
  promptId: string;
  matches: string[];
  revealed: boolean[];
  chatUnlocked?: boolean[];
  createdAt: any;
  expiresAt: any;
}

async function investigateMatches() {
  const promptId = '2025-46'; // Note: using hyphen, not underscore
  console.log(`🔍 Starting match investigation for prompt: ${promptId}\n`);

  try {
    // Query all matches for 2025-46
    const matchesSnapshot = await db
      .collection('weeklyMatches')
      .where('promptId', '==', promptId)
      .get();

    console.log(`📊 Total match documents found: ${matchesSnapshot.size}\n`);

    if (matchesSnapshot.empty) {
      console.log(`❌ No matches found for prompt ${promptId}`);
      return;
    }

    // Data structures for analysis
    const allMatches = new Map<string, MatchDoc>();
    const usersWithNullMatches: string[] = [];
    const nullMatchDetails: Array<{ netid: string; matches: string[]; nullPositions: number[] }> = [];

    // Parse all match documents
    matchesSnapshot.docs.forEach((doc) => {
      const data = doc.data() as MatchDoc;
      allMatches.set(data.netid, data);

      // Check for null/empty matches
      const nullPositions: number[] = [];
      data.matches.forEach((match, index) => {
        if (match === null || match === 'null' || match === undefined || match === '' || !match) {
          nullPositions.push(index);
        }
      });

      if (nullPositions.length > 0) {
        usersWithNullMatches.push(data.netid);
        nullMatchDetails.push({
          netid: data.netid,
          matches: data.matches,
          nullPositions
        });
      }
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('NULL MATCHES ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`❌ Users with null matches: ${usersWithNullMatches.length}`);

    if (nullMatchDetails.length > 0) {
      console.log('\nDetailed breakdown:\n');
      nullMatchDetails.forEach(({ netid, matches, nullPositions }) => {
        console.log(`  User: ${netid}`);
        console.log(`  Matches: [${matches.join(', ')}]`);
        console.log(`  Null positions: [${nullPositions.join(', ')}]`);
        console.log('');
      });
    } else {
      console.log('  ✅ No null matches found!\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('MUTUALITY ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Check for non-mutual matches
    const nonMutualPairs: Array<{ userA: string; userB: string; direction: string }> = [];
    const checkedPairs = new Set<string>();

    allMatches.forEach((matchDocA, netidA) => {
      matchDocA.matches.forEach((netidB) => {
        // Skip null/empty matches
        if (!netidB || netidB === 'null' || netidB === '') return;

        // Create a unique key for this pair
        const pairKey = [netidA, netidB].sort().join('-');

        // Skip if we've already checked this pair
        if (checkedPairs.has(pairKey)) return;
        checkedPairs.add(pairKey);

        // Check if userB has userA as a match
        const matchDocB = allMatches.get(netidB);

        if (!matchDocB) {
          console.log(`  ⚠️  User ${netidB} (matched with ${netidA}) has no match document`);
          nonMutualPairs.push({
            userA: netidA,
            userB: netidB,
            direction: `${netidA} → ${netidB} (no reciprocal document)`
          });
          return;
        }

        const hasReciprocal = matchDocB.matches.includes(netidA);

        if (!hasReciprocal) {
          nonMutualPairs.push({
            userA: netidA,
            userB: netidB,
            direction: `${netidA} → ${netidB} (but ${netidB} ↛ ${netidA})`
          });
        }
      });
    });

    console.log(`❌ Non-mutual match pairs found: ${nonMutualPairs.length}`);

    if (nonMutualPairs.length > 0) {
      console.log('\nDetailed breakdown:\n');
      nonMutualPairs.forEach(({ direction }, index) => {
        console.log(`  ${index + 1}. ${direction}`);
      });
      console.log('');
    } else {
      console.log('  ✅ All matches are mutual!\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('MATCH DISTRIBUTION ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Analyze match counts
    const matchCounts = new Map<number, number>();
    allMatches.forEach((matchDoc) => {
      const validMatches = matchDoc.matches.filter(m => m && m !== 'null').length;
      matchCounts.set(validMatches, (matchCounts.get(validMatches) || 0) + 1);
    });

    console.log('Distribution of match counts:\n');
    Array.from(matchCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([count, users]) => {
        console.log(`  ${count} matches: ${users} users`);
      });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('SAMPLE MATCH DATA');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Show first 5 match documents as examples
    let sampleCount = 0;
    allMatches.forEach((matchDoc, netid) => {
      if (sampleCount < 5) {
        console.log(`User: ${netid}`);
        console.log(`  Matches: [${matchDoc.matches.join(', ')}]`);
        console.log(`  Revealed: [${matchDoc.revealed.join(', ')}]`);
        console.log('');
        sampleCount++;
      }
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Total users in 2025_46: ${allMatches.size}`);
    console.log(`Users with null matches: ${usersWithNullMatches.length}`);
    console.log(`Non-mutual match pairs: ${nonMutualPairs.length}`);
    console.log('');

    if (usersWithNullMatches.length === 0 && nonMutualPairs.length === 0) {
      console.log('✅ No bugs found! All matches are valid and mutual.');
    } else {
      console.log('❌ BUGS CONFIRMED:');
      if (usersWithNullMatches.length > 0) {
        console.log(`  - ${usersWithNullMatches.length} users have null matches`);
      }
      if (nonMutualPairs.length > 0) {
        console.log(`  - ${nonMutualPairs.length} non-mutual match pairs`);
      }
    }

    console.log('\n🔍 Investigation complete!\n');

    // Return data for further processing
    return {
      totalUsers: allMatches.size,
      usersWithNullMatches,
      nullMatchDetails,
      nonMutualPairs,
      matchCounts,
      allMatches
    };

  } catch (error) {
    console.error('❌ Error during investigation:', error);
    throw error;
  }
}

// Run the investigation
investigateMatches()
  .then(() => {
    console.log('Investigation script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Investigation script failed:', error);
    process.exit(1);
  });
