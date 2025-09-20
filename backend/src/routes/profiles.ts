import express from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../firebaseAdmin";
import {
    CreateProfileInput,
    FirestoreDoc,
    Gender,
    ProfileDoc,
    ProfileDocWrite,
    ProfileResponse,
    UpdateProfileInput
} from "../../types"; // Adjust path as needed

const router = express.Router();

//converts birhdat to Date object for storage
const convertToDate = (value: any): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    return new Date(value);
  }
  //handle Firestore Timestamp
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
};

// Convert Firestore profile doc to API response
const profileDocToResponse = (doc: FirestoreDoc<ProfileDoc>): ProfileResponse => ({
  netid: doc.netid,
  bio: doc.bio,
  gender: doc.gender,
  birthdate: doc.birthdate instanceof Date 
    ? doc.birthdate.toISOString() 
    : doc.birthdate.toDate().toISOString(),
  instagram: doc.instagram,
  snapchat: doc.snapchat,
  phoneNumber: doc.phoneNumber,
  year: doc.year,
  school: doc.school,
  major: doc.major,
  pictures: doc.pictures,
  createdAt: doc.createdAt instanceof Date 
    ? doc.createdAt.toISOString() 
    : doc.createdAt.toDate().toISOString(),
  updatedAt: doc.updatedAt instanceof Date 
    ? doc.updatedAt.toISOString() 
    : doc.updatedAt.toDate().toISOString()
});

// GET all profiles (for matching/discovery)
router.get("/api/profiles", async (req, res) => {
  try {
    const { limit = "50", gender, school, minYear, maxYear } = req.query;
    
    let query = db.collection("profiles").limit(parseInt(limit as string));
    
    // Apply filters if provided
    if (gender && typeof gender === "string") {
      query = query.where("gender", "==", gender);
    }
    if (school && typeof school === "string") {
      query = query.where("school", "==", school);
    }
    if (minYear && typeof minYear === "string") {
      query = query.where("year", ">=", parseInt(minYear));
    }
    if (maxYear && typeof maxYear === "string") {
      query = query.where("year", "<=", parseInt(maxYear));
    }

    const snapshot = await query.get();
    const profiles: ProfileResponse[] = snapshot.docs.map((doc) => 
      profileDocToResponse({ id: doc.id, ...doc.data() as ProfileDoc })
    );
    
    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// GET profile by netid
router.get("/api/profiles/:netid", async (req, res) => {
  try {
    const { netid } = req.params;
    const snapshot = await db.collection("profiles").where("netid", "==", netid).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const doc = snapshot.docs[0];
    const profile = profileDocToResponse({ id: doc.id, ...doc.data() as ProfileDoc });
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// POST create new profile
router.post("/api/profiles", async (req, res) => {
  try {
    console.log("Creating profile:", req.body);
    const profileData: CreateProfileInput = req.body;
    
    // Validate required fields
    if (!profileData.netid || !profileData.bio || !profileData.gender || 
        !profileData.birthdate || !profileData.year || !profileData.school) {
      return res.status(400).json({ 
        error: "netid, bio, gender, birthdate, year, and school are required" 
      });
    }

    // Check if user exists
    const userSnapshot = await db.collection("users").where("netid", "==", profileData.netid).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ error: "User with this netid does not exist" });
    }

    // Check if profile already exists
    const existingProfile = await db.collection("profiles").where("netid", "==", profileData.netid).get();
    if (!existingProfile.empty) {
      return res.status(409).json({ error: "Profile for this netid already exists" });
    }

    // Validate enum values
    const validGenders: Gender[] = ['female', 'male', 'non-binary'];
    if (!validGenders.includes(profileData.gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }

    // Create profile document
    const profileDoc: ProfileDocWrite = {
      ...profileData,
      birthdate: convertToDate(profileData.birthdate),
      major: profileData.major || [],
      pictures: profileData.pictures || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("profiles").add(profileDoc);
    res.status(201).json({ 
      id: docRef.id, 
      netid: profileData.netid,
      message: "Profile created successfully" 
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// PUT update profile
router.put("/api/profiles/:netid", async (req, res) => {
  try {
    const { netid } = req.params;
    const updateData: UpdateProfileInput = req.body;
    
    const snapshot = await db.collection("profiles").where("netid", "==", netid).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Validate gender if provided
    if (updateData.gender) {
      const validGenders: Gender[] = ['female', 'male', 'non-binary'];
      if (!validGenders.includes(updateData.gender)) {
        return res.status(400).json({ error: "Invalid gender value" });
      }
    }

    // Convert birthdate to Date if provided
    const updateDoc: Partial<ProfileDocWrite> = {
      ...updateData,
      ...(updateData.birthdate && { birthdate: convertToDate(updateData.birthdate) }),
      updatedAt: FieldValue.serverTimestamp()
    };

    const doc = snapshot.docs[0];
    await doc.ref.update(updateDoc);
    
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// DELETE profile
router.delete("/api/profiles/:netid", async (req, res) => {
  try {
    const { netid } = req.params;
    const snapshot = await db.collection("profiles").where("netid", "==", netid).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const doc = snapshot.docs[0];
    await doc.ref.delete();
    
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// GET profiles for matching (exclude specific netid, add matching logic)
router.get("/api/profiles/:netid/matches", async (req, res) => {
  try {
    const { netid } = req.params;
    const { limit = "20" } = req.query;

    // Get current user's profile to use for matching logic
    const currentUserSnapshot = await db.collection("profiles").where("netid", "==", netid).get();
    if (currentUserSnapshot.empty) {
      return res.status(404).json({ error: "Current user profile not found" });
    }

    // Get potential matches (exclude current user)
    const snapshot = await db.collection("profiles")
      .where("netid", "!=", netid)
      .limit(parseInt(limit as string))
      .get();

    const matches: ProfileResponse[] = snapshot.docs.map((doc) => 
      profileDocToResponse({ id: doc.id, ...doc.data() as ProfileDoc })
    );

    // TODO: Add matching algorithm logic here
    // For now, just return all profiles except current user
    
    res.status(200).json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;