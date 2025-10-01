import { db } from "../../firebaseAdmin";

// Schema for our email documents
interface EmailDoc {
  id: string;
  email: string;
  [key: string]: any;
}

class EmailCache {
  private cache: EmailDoc[] = [];
  private initialized = false;
  private listener: (() => void) | null = null;

  // Initialize singleton
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initial call to Firebase 
    const snapshot = await db.collection("landing-emails").get();
    this.cache = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailDoc[];

    console.log(`Email cache initialized with ${this.cache.length} emails`);

    // Listener so that we are not spamming Firestore
    this.listener = db.collection("landing-emails").onSnapshot(
      (snapshot) => {
        this.cache = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmailDoc[];
        console.log(`Email cache updated: ${this.cache.length} emails`);
      },
      (error) => {
        console.error("Error in email cache listener:", error);
      }
    );

    this.initialized = true;
  }

  getAll(): EmailDoc[] {
    if (!this.initialized) {
      throw new Error("Email cache not initialized");
    }
    return this.cache;
  }

  emailExists(email: string): boolean {
    if (!this.initialized) {
      throw new Error("Email cache not initialized");
    }
    const normalizedEmail = email.toLowerCase();
    return this.cache.some(
      (doc) => doc.email.toLowerCase() === normalizedEmail
    );
  }

  destroy(): void {
    if (this.listener) {
      this.listener();
      this.listener = null;
    }
    this.initialized = false;
    this.cache = [];
  }
}

export const emailCache = new EmailCache();
