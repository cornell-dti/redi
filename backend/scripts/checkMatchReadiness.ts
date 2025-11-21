import { db } from "../firebaseAdmin";

async function checkMatchReadiness() {
  console.log("=".repeat(80));
  console.log("REDI MATCH GENERATION READINESS CHECK");
  console.log("=".repeat(80));
  console.log();

  try {
    // 1. Check for active prompt
    console.log("1. CHECKING ACTIVE PROMPT");
    console.log("-".repeat(80));

    const activePromptSnapshot = await db
      .collection("weeklyPrompts")
      .where("active", "==", true)
      .limit(1)
      .get();

    if (activePromptSnapshot.empty) {
      console.log("❌ NO ACTIVE PROMPT FOUND");
      console.log();
      return;
    }

    const activePromptDoc = activePromptSnapshot.docs[0];
    const promptId = activePromptDoc.id;
    const promptData = activePromptDoc.data();

    console.log(`✅ Active Prompt Found: ${promptId}`);
    console.log(`   Question: ${promptData.question}`);
    console.log(`   Status: ${promptData.status}`);

    // Parse dates
    const releaseDate = promptData.releaseDate?.toDate?.() || new Date(promptData.releaseDate);
    const matchDate = promptData.matchDate?.toDate?.() || new Date(promptData.matchDate);

    console.log(`   Release Date: ${releaseDate.toISOString()} (${releaseDate.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET)`);
    console.log(`   Match Date: ${matchDate.toISOString()} (${matchDate.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET)`);
    console.log();

    // Check if match date is tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isTomorrow =
      matchDate.getFullYear() === tomorrow.getFullYear() &&
      matchDate.getMonth() === tomorrow.getMonth() &&
      matchDate.getDate() === tomorrow.getDate();

    if (isTomorrow) {
      console.log("✅ Match date is set for TOMORROW - matches will generate!");
    } else {
      console.log(`⚠️  Match date is ${matchDate.toDateString()}, not tomorrow`);
    }
    console.log();

    // 2. Count user responses
    console.log("2. CHECKING USER RESPONSES");
    console.log("-".repeat(80));

    const responsesSnapshot = await db
      .collection("weeklyPromptResponses")
      .where("promptId", "==", promptId)
      .get();

    console.log(`📊 Total Responses: ${responsesSnapshot.size}`);

    if (responsesSnapshot.size === 0) {
      console.log("❌ NO RESPONSES - matches cannot be generated!");
      console.log();
      return;
    }

    // Get unique users
    const userNetids = new Set<string>();
    responsesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      userNetids.add(data.netid);
    });

    console.log(`👥 Unique Users: ${userNetids.size}`);
    console.log();

    // 3. Check profiles exist
    console.log("3. CHECKING USER PROFILES");
    console.log("-".repeat(80));

    let profilesFound = 0;
    let profilesMissing = 0;
    const missingProfiles: string[] = [];

    for (const netid of Array.from(userNetids).slice(0, 50)) {
      const profileDoc = await db.collection("profiles").doc(netid).get();
      if (profileDoc.exists) {
        profilesFound++;
      } else {
        profilesMissing++;
        missingProfiles.push(netid);
      }
    }

    console.log(`✅ Profiles Found: ${profilesFound}`);
    if (profilesMissing > 0) {
      console.log(`⚠️  Profiles Missing: ${profilesMissing}`);
      console.log(`   Missing: ${missingProfiles.slice(0, 5).join(", ")}${profilesMissing > 5 ? "..." : ""}`);
    }
    console.log();

    // 4. Sample responses
    console.log("4. SAMPLE RESPONSES");
    console.log("-".repeat(80));

    const sampleResponses = responsesSnapshot.docs.slice(0, 5);
    sampleResponses.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${data.netid}: "${data.answer}"`);
    });
    console.log();

    // 5. Check for existing matches
    console.log("5. CHECKING EXISTING MATCHES FOR THIS PROMPT");
    console.log("-".repeat(80));

    const existingMatchesSnapshot = await db
      .collection("weeklyMatches")
      .where("promptId", "==", promptId)
      .get();

    if (existingMatchesSnapshot.size > 0) {
      console.log(`⚠️  ${existingMatchesSnapshot.size} matches already exist for this prompt!`);
      console.log("   This could indicate matches were already generated or manually created.");
    } else {
      console.log("✅ No existing matches - ready for fresh generation");
    }
    console.log();

    // 6. Final Assessment
    console.log("=".repeat(80));
    console.log("FINAL ASSESSMENT");
    console.log("=".repeat(80));

    const issues: string[] = [];
    const warnings: string[] = [];

    if (!isTomorrow) {
      issues.push(`Match date is ${matchDate.toDateString()}, not tomorrow`);
    }

    if (responsesSnapshot.size === 0) {
      issues.push("No user responses");
    } else if (userNetids.size < 2) {
      issues.push("Not enough users (need at least 2)");
    }

    if (profilesMissing > 0) {
      warnings.push(`${profilesMissing} users are missing profiles`);
    }

    if (existingMatchesSnapshot.size > 0) {
      warnings.push(`${existingMatchesSnapshot.size} matches already exist for this prompt`);
    }

    if (issues.length === 0) {
      console.log("✅ READY FOR MATCH GENERATION");
      console.log();
      console.log(`Expected Match Generation:`);
      console.log(`   Time: Friday at 12:01 AM Eastern Time (5:01 AM UTC)`);
      console.log(`   Date: ${matchDate.toLocaleDateString('en-US', { timeZone: 'America/New_York' })}`);
      console.log(`   Users: ${userNetids.size} users will receive matches`);
      console.log(`   Prompt: ${promptId}`);
    } else {
      console.log("❌ NOT READY - BLOCKING ISSUES FOUND:");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    if (warnings.length > 0) {
      console.log();
      console.log("⚠️  WARNINGS:");
      warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    console.log();
    console.log("=".repeat(80));

  } catch (error) {
    console.error("Error checking match readiness:", error);
    throw error;
  }
}

// Run the check
checkMatchReadiness()
  .then(() => {
    console.log("Check complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Check failed:", error);
    process.exit(1);
  });
