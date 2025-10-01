import express from "express";
import admin from "firebase-admin";
import { db } from "../../firebaseAdmin";
import { emailCache } from "../services/emailCache";

const router = express.Router();

// GET document(s) from Firestore (using cache)
router.get("/api/landing-emails", async (req, res) => {
  try {
    const docs = emailCache.getAll();
    res.status(200).json(docs);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// GET the number of users signed up on the wait list
router.get("/api/registered-count", async (req, res) => {
  try {
    const docs = db.collection("stats").doc("global")
    const snapshot = await docs.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Stats doc not found" });
    }

    res.status(200).json(snapshot.data());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// POST a new document
router.post("/api/landing-emails", async (req, res) => {
  try {
    const data = req.body;
    if (!data.email || typeof data.email !== "string" || !data.email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Check cache first (much faster than Firestore query)
    if (emailCache.emailExists(data.email)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const docRef = await db.collection("landing-emails").add(data);

    await db.collection("stats").doc("global").update({
      userCount: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding email:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
