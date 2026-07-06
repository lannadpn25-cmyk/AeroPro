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
import { getAuth } from 'firebase/auth';

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

// Initialize Auth
export const auth = getAuth(app);

/**
 * Gets or generates a unique user identifier for cloud data isolation
 */
export function getOrCreateUserId(): string {
  const currentAuthUser = auth.currentUser;
  if (currentAuthUser) {
    return currentAuthUser.uid;
  }
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
      const data = doc.data();
      list.push({ ...data, id: data.id || doc.id.replace(`${uid}_`, '') });
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
    const docId = `${uid}_${activity.id}`;
    const docRef = doc(db, ACTIVITIES_COLL, docId);
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
    const uid = getOrCreateUserId();
    const docId = `${uid}_${activityId}`;
    const docRef = doc(db, ACTIVITIES_COLL, docId);
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
      const data = doc.data();
      list.push({ ...data, id: data.id || doc.id.replace(`${uid}_`, '') });
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
    const docId = `${uid}_${template.id}`;
    const docRef = doc(db, TEMPLATES_COLL, docId);
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
    const uid = getOrCreateUserId();
    const docId = `${uid}_${templateId}`;
    const docRef = doc(db, TEMPLATES_COLL, docId);
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
      const data = doc.data();
      list.push({ ...data, id: data.id || doc.id.replace(`${uid}_`, '') });
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
    const docId = `${uid}_${workout.id}`;
    const docRef = doc(db, COMPLETED_COLL, docId);
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
    const uid = getOrCreateUserId();
    const docId = `${uid}_${workoutId}`;
    const docRef = doc(db, COMPLETED_COLL, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting completed workout from Firestore:", error);
  }
}

/**
 * Migrates local app data to the logged-in user's cloud Firestore collections
 */
export async function dbMigrateDataToUser(
  newUid: string,
  localData: {
    activities: any[];
    templates: any[];
    completedWorkouts: any[];
    weeklyGoals: any;
  }
): Promise<{
  activities: any[];
  templates: any[];
  completedWorkouts: any[];
  weeklyGoals: any;
}> {
  try {
    // 1. Migrate Goals (if exists locally, upload)
    if (localData.weeklyGoals) {
      const docRef = doc(db, GOALS_COLL, newUid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...localData.weeklyGoals,
          userId: newUid,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 2. Migrate custom and standard Activities
    for (const act of localData.activities) {
      const docId = `${newUid}_${act.id}`;
      const docRef = doc(db, ACTIVITIES_COLL, docId);
      // Only migrate if not already exists on server to prevent overwriting cloud state with local/device default
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...act,
          userId: newUid,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 3. Migrate Templates
    for (const t of localData.templates) {
      const docId = `${newUid}_${t.id}`;
      const docRef = doc(db, TEMPLATES_COLL, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...t,
          userId: newUid,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 4. Migrate Completed Workouts
    for (const comp of localData.completedWorkouts) {
      const docId = `${newUid}_${comp.id}`;
      const docRef = doc(db, COMPLETED_COLL, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...comp,
          userId: newUid,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Now fetch the absolute up-to-date states from Firestore for this user
    const finalGoalsSnap = await getDoc(doc(db, GOALS_COLL, newUid));
    const finalGoals = finalGoalsSnap.exists() ? finalGoalsSnap.data() : localData.weeklyGoals;

    const actSnap = await getDocs(query(collection(db, ACTIVITIES_COLL), where('userId', '==', newUid)));
    const finalActivities: any[] = [];
    actSnap.forEach((doc) => {
      const data = doc.data();
      finalActivities.push({ ...data, id: data.id || doc.id.replace(`${newUid}_`, '') });
    });

    const tempSnap = await getDocs(query(collection(db, TEMPLATES_COLL), where('userId', '==', newUid)));
    const finalTemplates: any[] = [];
    tempSnap.forEach((doc) => {
      const data = doc.data();
      finalTemplates.push({ ...data, id: data.id || doc.id.replace(`${newUid}_`, '') });
    });

    const compSnap = await getDocs(query(collection(db, COMPLETED_COLL), where('userId', '==', newUid)));
    const finalCompleted: any[] = [];
    compSnap.forEach((doc) => {
      const data = doc.data();
      finalCompleted.push({ ...data, id: data.id || doc.id.replace(`${newUid}_`, '') });
    });

    return {
      weeklyGoals: finalGoals,
      activities: finalActivities.length > 0 ? finalActivities : localData.activities,
      templates: finalTemplates.length > 0 ? finalTemplates : localData.templates,
      completedWorkouts: finalCompleted.length > 0 ? finalCompleted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : localData.completedWorkouts
    };

  } catch (error) {
    console.error("Error migrating data to logged-in user account:", error);
    throw error;
  }
}
