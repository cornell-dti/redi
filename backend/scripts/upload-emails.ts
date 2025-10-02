import admin from 'firebase-admin';
import { db } from '../firebaseAdmin';
import emailData from '../response.json';

async function uploadEmails() {
  try {
    console.log(
      `\nStarting batch upload of ${emailData.length} cleaned emails...`
    );

    let totalUploaded = 0;
    let skipped = 0;
    let batchCount = 0;

    // Process emails in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;

    for (let i = 0; i < emailData.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const currentBatch = emailData.slice(i, i + BATCH_SIZE);
      batchCount++;

      console.log(
        `\nProcessing batch ${batchCount} (${currentBatch.length} emails)...`
      );

      let batchUploaded = 0;
      let batchSkipped = 0;

      for (const user of currentBatch) {
        // Check for duplicates
        const existingDoc = await db
          .collection('landing-emails')
          .where('email', '==', user.email.toLowerCase())
          .get();

        if (!existingDoc.empty) {
          console.log(` Skipping duplicate: ${user.email}`);
          batchSkipped++;
          continue;
        }

        // Add to batch
        const docRef = db.collection('landing-emails').doc();
        batch.set(docRef, {
          email: user.email.toLowerCase(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: 'batch_upload',
        });

        batchUploaded++;
        console.log(`Added: ${user.email}`);
      }

      // Commit the batch
      if (batchUploaded > 0) {
        await batch.commit();
        console.log(
          `Committed batch ${batchCount}: ${batchUploaded} emails uploaded`
        );
        totalUploaded += batchUploaded;
      } else {
        console.log(`Batch ${batchCount}: No new emails to upload`);
      }

      skipped += batchSkipped;

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < emailData.length) {
        console.log(` Waiting 1 second before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Update the global stats counter
    console.log(`\Updating global stats counter...`);
    const statsDoc = db.collection('stats').doc('global');

    try {
      const currentStats = await statsDoc.get();
      if (currentStats.exists) {
        await statsDoc.update({
          userCount: admin.firestore.FieldValue.increment(totalUploaded),
        });
        console.log(` Incremented userCount by ${totalUploaded}`);
      } else {
        await statsDoc.set({ userCount: totalUploaded });
        console.log(` Created stats document with userCount: ${totalUploaded}`);
      }
    } catch (error) {
      console.error(` Error updating stats:`, error);
      // Try to set initial value
      await statsDoc.set({ userCount: totalUploaded });
      console.log(
        `Set initial stats document with userCount: ${totalUploaded}`
      );
    }

    console.log(`\n Batch upload complete!`);
    console.log(`Total emails processed: ${emailData.length}`);
    console.log(`Successfully uploaded: ${totalUploaded}`);
    console.log(`Skipped (duplicates): ${skipped}`);
    console.log(`Batches processed: ${batchCount}`);

    // Verify the upload
    const finalCount = await db.collection('landing-emails').get();
    console.log(`\Verification: Total emails in database: ${finalCount.size}`);

    process.exit(0);
  } catch (error) {
    console.error('\nError uploading emails:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : String(error)
    );
    process.exit(1);
  }
}

// Initialize Firebase connection first
console.log('Initializing Firebase connection...');
uploadEmails();
