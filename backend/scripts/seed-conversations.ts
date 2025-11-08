import admin from 'firebase-admin';
import { db } from '../firebaseAdmin';

// Sample conversation starters and messages
const conversationStarters = [
  'Hey! Want to grab coffee at CTB this weekend?',
  'Thanks for the study session! Good luck on the exam',
  'The farmers market was so fun! We should go again',
  'Are you free for lunch tomorrow?',
  'How did your presentation go?',
  'Want to check out that new restaurant on campus?',
  'Did you finish the problem set yet?',
  'I found a great study spot in the library!',
  'Are you going to the event tonight?',
  'Thanks for recommending that book!',
];

const messageTemplates = [
  [
    'Hey! How are you doing?',
    "I'm good! How about you?",
    'Doing well! Want to grab lunch sometime?',
    'That sounds great! How about tomorrow?',
    'Perfect! See you at 12:30?',
    'Sounds good!',
  ],
  [
    'Did you understand the lecture today?',
    'Yeah, mostly. Which part was confusing?',
    'The last section about algorithms',
    'Oh yeah, that was tricky. Want to go over it together?',
    'That would be super helpful!',
    'Cool, when are you free?',
    'How about 3pm at Mann?',
    'Perfect, see you then!',
  ],
  [
    'Hey! I heard you like hiking',
    'Yeah! Do you hike too?',
    'Yeah! Want to go to Ithaca Falls this weekend?',
    'That sounds amazing! What time?',
    'How about Saturday morning at 9?',
    'Perfect! Should I bring anything?',
    'Just water and good shoes!',
    'Great, see you then!',
  ],
  [
    'How was your weekend?',
    'Pretty good! Went to the farmers market',
    'Oh nice! What did you get?',
    'Some fresh produce and homemade bread',
    'That sounds delicious!',
  ],
  [
    'Are you going to the game on Friday?',
    'I was thinking about it! Are you?',
    'Yeah! A group of us are going',
    'Can I join?',
    'Of course! The more the merrier',
    'Awesome, thanks!',
  ],
];

interface UserData {
  firebaseUid: string;
  netid: string;
  name?: string;
  profileImages?: string[];
}

async function seedConversations() {
  try {
    console.log('\n🌱 Starting conversation seeding...\n');

    // Fetch all users from Firestore
    console.log('📥 Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found in database. Please create users first.');
      process.exit(1);
    }

    const users: UserData[] = usersSnapshot.docs.map(
      (doc) => doc.data() as UserData
    );
    console.log(`✅ Found ${users.length} users\n`);

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create conversations.');
      process.exit(1);
    }

    console.log(`🎯 Ensuring every user has at least one conversation...\n`);

    let createdCount = 0;
    let skippedCount = 0;
    const usedPairs = new Set<string>();
    const usersWithConversations = new Set<string>();

    // Helper function to create a conversation between two users
    const createConversation = async (user1: UserData, user2: UserData) => {
      const pairId = [user1.firebaseUid, user2.firebaseUid].sort().join('_');

      // Skip if we've already created this pair
      if (usedPairs.has(pairId)) {
        console.log(
          `⏭️  Skipping duplicate pair: ${user1.netid} <-> ${user2.netid}`
        );
        skippedCount++;
        return false;
      }

      usedPairs.add(pairId);

      // Check if conversation already exists
      const participantIds = [user1.firebaseUid, user2.firebaseUid].sort();
      const existingConv = await db
        .collection('conversations')
        .where('participantIds', '==', participantIds)
        .get();

      if (!existingConv.empty) {
        console.log(
          `⏭️  Conversation already exists: ${user1.netid} <-> ${user2.netid}`
        );
        // Mark these users as having conversations
        usersWithConversations.add(user1.firebaseUid);
        usersWithConversations.add(user2.firebaseUid);
        skippedCount++;
        return false;
      }

      // Create conversation
      const conversationData = {
        participantIds,
        participants: {
          [user1.firebaseUid]: {
            name: user1.name || user1.netid,
            image: user1.profileImages?.[0] || null,
            netid: user1.netid,
          },
          [user2.firebaseUid]: {
            name: user2.name || user2.netid,
            image: user2.profileImages?.[0] || null,
            netid: user2.netid,
          },
        },
        lastMessage: null as any,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const conversationRef = await db
        .collection('conversations')
        .add(conversationData);
      console.log(
        `✅ Created conversation: ${user1.netid} <-> ${user2.netid} (${conversationRef.id})`
      );

      // Add messages to the conversation
      const messageSet =
        messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
      const numMessages = Math.min(
        messageSet.length,
        3 + Math.floor(Math.random() * 5)
      ); // 3-7 messages

      console.log(`   💬 Adding ${numMessages} messages...`);

      let lastMessageData: any = null;

      for (let j = 0; j < numMessages; j++) {
        const senderId = j % 2 === 0 ? user1.firebaseUid : user2.firebaseUid;
        const messageText = messageSet[j];

        // Create timestamp with some spacing (older messages first)
        const minutesAgo =
          (numMessages - j) * 15 + Math.floor(Math.random() * 10);
        const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);

        const messageData = {
          text: messageText,
          senderId,
          timestamp: admin.firestore.Timestamp.fromDate(timestamp),
          read: j < numMessages - 1, // Last message is unread
          status: j < numMessages - 1 ? 'read' : 'delivered',
        };

        await conversationRef.collection('messages').add(messageData);

        // Track the most recent message
        if (j === numMessages - 1) {
          lastMessageData = {
            text: messageText,
            senderId,
            timestamp: admin.firestore.Timestamp.fromDate(timestamp),
          };
        }
      }

      // Update conversation with last message
      if (lastMessageData) {
        await conversationRef.update({
          lastMessage: lastMessageData,
          updatedAt: lastMessageData.timestamp,
        });
      }

      // Mark these users as having conversations
      usersWithConversations.add(user1.firebaseUid);
      usersWithConversations.add(user2.firebaseUid);
      createdCount++;
      console.log(`   ✅ Messages added\n`);

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
      return true;
    };

    // Phase 1: Ensure every user has at least one conversation
    console.log(
      '📋 Phase 1: Ensuring all users have at least one conversation...\n'
    );

    // Shuffle users array to randomize pairings
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledUsers.length; i++) {
      const user = shuffledUsers[i];

      // Check if user already has a conversation
      if (usersWithConversations.has(user.firebaseUid)) {
        console.log(`✓ ${user.netid} already has a conversation`);
        continue;
      }

      // Find another user who doesn't have a conversation yet, or any user
      let partnerIndex = -1;

      // First, try to find a user without a conversation
      for (let j = 0; j < shuffledUsers.length; j++) {
        if (
          i !== j &&
          !usersWithConversations.has(shuffledUsers[j].firebaseUid)
        ) {
          partnerIndex = j;
          break;
        }
      }

      // If all users have conversations, pair with any other user
      if (partnerIndex === -1) {
        for (let j = 0; j < shuffledUsers.length; j++) {
          if (i !== j) {
            const pairId = [user.firebaseUid, shuffledUsers[j].firebaseUid]
              .sort()
              .join('_');
            if (!usedPairs.has(pairId)) {
              partnerIndex = j;
              break;
            }
          }
        }
      }

      if (partnerIndex !== -1) {
        await createConversation(user, shuffledUsers[partnerIndex]);
      }
    }

    // Phase 2: Create additional random conversations
    console.log('\n📋 Phase 2: Creating additional random conversations...\n');

    const additionalConversations = Math.min(
      Math.floor(users.length / 2), // Add up to half the number of users in additional conversations
      10 // Cap at 10 additional conversations
    );

    let additionalCreated = 0;
    let attempts = 0;
    const maxAttempts = additionalConversations * 3; // Try up to 3x the target to account for duplicates

    while (
      additionalCreated < additionalConversations &&
      attempts < maxAttempts
    ) {
      attempts++;

      // Select two random different users
      const user1Index = Math.floor(Math.random() * users.length);
      let user2Index = Math.floor(Math.random() * users.length);

      // Ensure different users
      while (user2Index === user1Index) {
        user2Index = Math.floor(Math.random() * users.length);
      }

      const success = await createConversation(
        users[user1Index],
        users[user2Index]
      );
      if (success) {
        additionalCreated++;
      }
    }

    console.log('\n✅ Conversation seeding complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total users: ${users.length}`);
    console.log(
      `   - Users with conversations: ${usersWithConversations.size}`
    );
    console.log(`   - Total conversations created: ${createdCount}`);
    console.log(`   - Skipped (duplicates/existing): ${skippedCount}`);

    // Verify
    const finalCount = await db.collection('conversations').get();
    console.log(
      `\n🔍 Verification: Total conversations in database: ${finalCount.size}`
    );

    // Check for users without conversations
    const usersWithoutConversations = users.filter(
      (user) => !usersWithConversations.has(user.firebaseUid)
    );
    if (usersWithoutConversations.length > 0) {
      console.log(
        `\n⚠️  Warning: ${usersWithoutConversations.length} users still without conversations:`
      );
      usersWithoutConversations.forEach((user) => {
        console.log(`   - ${user.netid}`);
      });
    } else {
      console.log(`\n✅ All users have at least one conversation!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding conversations:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : String(error)
    );
    process.exit(1);
  }
}

// Initialize Firebase connection first
console.log('🔧 Initializing Firebase connection...');
seedConversations();
