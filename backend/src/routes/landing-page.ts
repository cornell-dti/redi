import express from "express";
import { db } from "../../firebaseAdmin";

const router = express.Router();

// GET document(s) from Firestore
router.get("/api/landing-emails", async (req, res) => {
  try {
    const snapshot = await db.collection("landing-emails").get();
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(docs);
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
    const existingDoc = await db.collection("landing-emails")
      .where("email", "==", data.email.toLowerCase())
      .get();
    
    if (!existingDoc.empty) {
      return res.status(409).json({ error: "Email already exists" });
    }
    const docRef = await db.collection("landing-emails").add(data);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding email:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
