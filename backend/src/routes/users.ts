import express from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../firebaseAdmin";
import {
  FirestoreDoc,
  UserDoc,
  UserDocWrite,
  UserResponse
} from "../../types";

const router = express.Router();

const validateCornellEmailAndExtractNetid = (email: string): { isValid: boolean; netid?: string } => {
  const emailRegex = /^([a-zA-Z0-9]+)@cornell\.edu$/;
  const match = email.match(emailRegex);
  
  if (match) {
    return { isValid: true, netid: match[1] };
  }
  
  return { isValid: false };
};

const userDocToResponse = (doc: FirestoreDoc<UserDoc>): UserResponse => ({
  netid: doc.netid,
  createdAt: doc.createdAt instanceof Date 
    ? doc.createdAt.toISOString() 
    : doc.createdAt.toDate().toISOString()
});

// GET all users (admin endpoint - need authentication)
router.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users: UserResponse[] = snapshot.docs.map((doc) => 
      userDocToResponse({ id: doc.id, ...doc.data() as UserDoc })
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// GET user by netid
router.get("/api/users/:netid", async (req, res) => {
  try {
    const { netid } = req.params;
    const snapshot = await db.collection("users").where("netid", "==", netid).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const doc = snapshot.docs[0];
    const user = userDocToResponse({ id: doc.id, ...doc.data() as UserDoc });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// POST create new user from Firebase Auth
router.post("/api/users/firebase-create", async (req, res) => {
  try {
    console.log("Creating user from auth:", req.body);
    const { email, firebaseUid } = req.body;
    
    if (!email || !firebaseUid) {
      return res.status(400).json({ error: "email and firebaseUid are required" });
    }

    const { isValid, netid } = validateCornellEmailAndExtractNetid(email);
    if (!isValid) {
      return res.status(400).json({ error: "Only Cornell emails (@cornell.edu) are allowed" });
    }

    // If user exists, reutrn their info
    const existingUser = await db.collection("users").where("netid", "==", netid).get();
    if (!existingUser.empty) {
      const doc = existingUser.docs[0];
      const user = userDocToResponse({ id: doc.id, ...doc.data() as UserDoc });
      return res.status(200).json({ 
        message: "User already exists",
        user
      });
    }

    if (!netid) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Create user document
    const userDoc: UserDocWrite = {
      netid,
      email,
      firebaseUid,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("users").add(userDoc);
    res.status(201).json({ 
      id: docRef.id, 
      netid,
      email,
      message: "User created successfully" 
    });
  } catch (error) {
    console.error("Error creating user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// POST login with Firebase verification
router.post("/api/users/firebase-login", async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;
    
    if (!email || !firebaseUid) {
      return res.status(400).json({ error: "email and firebaseUid are required" });
    }

    // Validate Cornell email
    const { isValid, netid } = validateCornellEmailAndExtractNetid(email);
    if (!isValid || !netid) {
      return res.status(400).json({ error: "Only Cornell emails (@cornell.edu) are allowed" });
    }

    const snapshot = await db.collection("users")
      .where("netid", "==", netid)
      .where("firebaseUid", "==", firebaseUid)
      .get();
    
    if (snapshot.empty) {
      return res.status(401).json({ error: "User not found or invalid credentials" });
    }

    const doc = snapshot.docs[0];
    const user = userDocToResponse({ id: doc.id, ...doc.data() as UserDoc });
    
    res.status(200).json({ 
      message: "Login successful", 
      user
    });
  } catch (error) {
    console.error("Error during login:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// DELETE user by netid
router.delete("/api/users/:netid", async (req, res) => {
  try {
    const { netid } = req.params;
    const snapshot = await db.collection("users").where("netid", "==", netid).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user document
    const doc = snapshot.docs[0];
    await doc.ref.delete();
    
    // Also delete associated profile if it exists
    const profileSnapshot = await db.collection("profiles").where("netid", "==", netid).get();
    if (!profileSnapshot.empty) {
      const profileDoc = profileSnapshot.docs[0];
      await profileDoc.ref.delete();
    }

    res.status(200).json({ message: "User and associated profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;