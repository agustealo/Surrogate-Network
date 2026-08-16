
'use server'; // Can be used by Server Components or called from Client through Server Actions

import { db } from '@/lib/firebase/firebase';
import type { Profile, FirestoreProfileDTO, Offering, Request as ProfileRequest, ProfileBadge } from '@/lib/types';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const PROFILES_COLLECTION = 'profiles';

// Helper to convert FirestoreProfileDTO to Profile (handles Timestamp)
function fromFirestoreDTO(docId: string, dto: FirestoreProfileDTO): Profile {
  return {
    ...dto,
    id: docId,
    createdAt: dto.createdAt.toDate().toISOString(),
  };
}

/**
 * Fetches a list of all profiles from Firestore.
 * @returns A promise that resolves to an array of Profile objects.
 */
export async function fetchProfiles(count: number = 20): Promise<Profile[]> {
  try {
    const profilesCollection = collection(db, PROFILES_COLLECTION);
    // Consider adding orderBy 'createdAt' or 'name' if needed, and pagination
    const q = query(profilesCollection, orderBy('createdAt', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);

    const profiles: Profile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreProfileDTO; // Assume data matches DTO
      profiles.push(fromFirestoreDTO(doc.id, data));
    });
    return profiles;
  } catch (error) {
    console.error("Error fetching profiles: ", error);
    throw new Error("Could not fetch profiles.");
  }
}

/**
 * Fetches a single profile by its ID from Firestore.
 * @param id - The ID of the profile to fetch.
 * @returns A promise that resolves to a Profile object or null if not found or on error.
 */
export async function fetchProfileById(id: string): Promise<Profile | null> {
  if (!id || typeof id !== 'string' || id.trim() === "") {
    console.error("fetchProfileById was called with an invalid ID:", id);
    return null; 
  }
  try {
    const profileDocRef = doc(db, PROFILES_COLLECTION, id);
    const docSnap = await getDoc(profileDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FirestoreProfileDTO; // Assume data matches DTO
      return fromFirestoreDTO(docSnap.id, data);
    } else {
      console.log(`No profile document found for ID: ${id}`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching profile by ID '${id}': `, error);
    // Provide a more detailed error message
    throw new Error(`Failed to fetch profile for ID '${id}'. Original error: ${error.message || String(error)}`);
  }
}

// Type for data needed to create a new profile (excluding generated id and createdAt)
export type NewProfileData = Omit<Profile, 'id' | 'createdAt'>;

/**
 * Adds a new profile to Firestore.
 * @param profileData - The data for the new profile.
 * @returns A promise that resolves to the ID of the newly created profile.
 */
export async function addProfile(profileData: NewProfileData): Promise<string> {
  try {
    const profilesCollection = collection(db, PROFILES_COLLECTION);
    // Prepare data for Firestore, ensuring embedded arrays are plain objects
    const dataToSave = {
      ...profileData,
      offerings: profileData.offerings.map(o => ({...o})),
      requests: profileData.requests.map(r => ({...r, tags: r.tags ? [...r.tags] : [] })),
      badges: profileData.badges ? profileData.badges.map(b => ({...b})) : [],
      createdAt: serverTimestamp(), // Firestore will set the timestamp on the server
    };
    const docRef = await addDoc(profilesCollection, dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding profile: ", error);
    throw new Error("Could not add profile.");
  }
}

