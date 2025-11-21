import { db } from "../firebaseAdmin";

async function checkRealAnswers() {
  console.log("=".repeat(80));
  console.log("CHECKING REAL PROMPT ANSWERS");
  console.log("=".repeat(80));
  console.log();

  try {
    // Get the active prompt
    const activePromptSnapshot = await db
      .collection("weeklyPrompts")
      .where("active", "==", true)
      .limit(1)
      .get();

    if (activePromptSnapshot.empty) {
      console.log("❌ NO ACTIVE PROMPT");
      return;
    }

    const promptDoc = activePromptSnapshot.docs[0];
    const promptId = promptDoc.id;
    const promptData = promptDoc.data();

    console.log(`Active Prompt: ${promptId}`);
    console.log(`Question: ${promptData.question}`);
    console.log();

    // Check weeklyPromptAnswers collection
    console.log("Checking 'weeklyPromptAnswers' collection:");
    console.log("-".repeat(80));

    const answersSnapshot = await db
      .collection("weeklyPromptAnswers")
      .where("promptId", "==", promptId)
      .get();

    console.log(`Total answers for ${promptId}: ${answersSnapshot.size}`);
    console.log();

    if (answersSnapshot.size > 0) {
      console.log("Sample answers:");
      answersSnapshot.docs.slice(0, 10).forEach((doc) => {
        const data = doc.data();
        console.log(`   ${data.netid}: "${data.answer}"`);
      });

      // Get unique users
      const uniqueUsers = new Set(answersSnapshot.docs.map((doc) => doc.data().netid));
      console.log();
      console.log(`Unique users: ${uniqueUsers.size}`);
      console.log(`Users: ${Array.from(uniqueUsers).join(", ")}`);
    }

    console.log();
    console.log("=".repeat(80));

    // Check all answers in the system
    const allAnswersSnapshot = await db.collection("weeklyPromptAnswers").get();
    console.log(`Total answers in entire system: ${allAnswersSnapshot.size}`);

    // Group by prompt
    const answersByPrompt = new Map<string, number>();
    allAnswersSnapshot.docs.forEach((doc) => {
      const promptId = doc.data().promptId;
      answersByPrompt.set(promptId, (answersByPrompt.get(promptId) || 0) + 1);
    });

    console.log("\nAnswers by prompt:");
    for (const [pid, count] of answersByPrompt.entries()) {
      console.log(`   ${pid}: ${count} answers`);
    }

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

checkRealAnswers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
