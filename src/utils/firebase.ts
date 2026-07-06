import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc
} from 'firebase/firestore';

// Read config from JSON or fallback
const firebaseConfig = {
  projectId: "aeropro-e746c",
  appId: "1:855594376263:web:06533c7b9bcb07855ea562",
  apiKey: "AIzaSyBa5A3UaAjAjFXEdv7r2dZ6S31UANhXDU4",
  authDomain: "aeropro-e746c.firebaseapp.com",
  storageBucket: "aeropro-e746c.firebasestorage.app",
  messagingSenderId: "855594376263",
  firestoreDatabaseId: "ai-studio-aeroprogressregi-9ddaacfb-e118-45e4-a1e8-e1eb90b5beac"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Gets or generates a unique user identifier for cloud data isolation
 */
export function getOrCreateUserId(): string {
  let userId = localStorage.getItem('aeroprogress_cloud_uid');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('aeroprogress_cloud_uid', userId);
  }
  return userId;
}

// Collections Keys
const GOALS_COLL = 'weeklyGoals';
const ACTIVITIES_COLL = 'activities';
const TEMPLATES_COLL = 'templates';
const COMPLETED_COLL = 'completedWorkouts';

/**
 * Fetches the user's weekly goals from Firestore
 */
export async function dbFetchWeeklyGoals(): Promise<any | null> {
  try {
    const uid = getOrCreateUserId();
    const docRef = doc(db, GOALS_COLL, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error("Error fetching weekly goals from Firestore:", error);
  }
  return null;
}

/**
 * Saves/updates the user's weekly goals in Firestore
 */
export async function dbSaveWeeklyGoals(goals: any): Promise<void> {
  try {
    const uid = getOrCreateUserId();
    const docRef = doc(db, GOALS_COLL, uid);
    await setDoc(docRef, {
      ...goals,
      userId: uid,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving weekly goals to Firestore:", error);
  }
}

/**
 * Fetches activities from Firestore
 */
export async function dbFetchActivities(): Promise<any[] | null> {
  try {
    const uid = getOrCreateUserId();
    const q = query(collection(db, ACTIVITIES_COLL), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id });
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    console.error("Error fetching activities from Firestore:", error);
  }
  return null;
}

/**
 * Saves a single activity to Firestore
 */
export async function dbSaveActivity(activity: any): Promise<void> {
  try {
    const uid = getOrCreateUserId();
    const docRef = doc(db, ACTIVITIES_COLL, activity.id);
    await setDoc(docRef, {
      ...activity,
      userId: uid,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving activity to Firestore:", error);
  }
}

/**
 * Deletes an activity from Firestore
 */
export async function dbDeleteActivity(activityId: string): Promise<void> {
  try {
    const docRef = doc(db, ACTIVITIES_COLL, activityId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting activity from Firestore:", error);
  }
}

/**
 * Fetches workout templates from Firestore
 */
export async function dbFetchTemplates(): Promise<any[] | null> {
  try {
    const uid = getOrCreateUserId();
    const q = query(collection(db, TEMPLATES_COLL), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id });
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    console.error("Error fetching templates from Firestore:", error);
  }
  return null;
}

/**
 * Saves a workout template to Firestore
 */
export async function dbSaveTemplate(template: any): Promise<void> {
  try {
    const uid = getOrCreateUserId();
    const docRef = doc(db, TEMPLATES_COLL, template.id);
    await setDoc(docRef, {
      ...template,
      userId: uid,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving template to Firestore:", error);
  }
}

/**
 * Deletes a workout template from Firestore
 */
export async function dbDeleteTemplate(templateId: string): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES_COLL, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting template from Firestore:", error);
  }
}

/**
 * Fetches completed workouts from Firestore
 */
export async function dbFetchCompletedWorkouts(): Promise<any[] | null> {
  try {
    const uid = getOrCreateUserId();
    const q = query(collection(db, COMPLETED_COLL), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id });
    });
    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching completed workouts from Firestore:", error);
  }
  return null;
}

/**
 * Saves a completed workout to Firestore
 */
export async function dbSaveCompletedWorkout(workout: any): Promise<void> {
  try {
    const uid = getOrCreateUserId();
    const docRef = doc(db, COMPLETED_COLL, workout.id);
    await setDoc(docRef, {
      ...workout,
      userId: uid,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving completed workout to Firestore:", error);
  }
}

/**
 * Deletes a completed workout from Firestore
 */
export async function dbDeleteCompletedWorkout(workoutId: string): Promise<void> {
  try {
    const docRef = doc(db, COMPLETED_COLL, workoutId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting completed workout from Firestore:", error);
  }
}
