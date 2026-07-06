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


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

/**
 * Recursively removes all undefined properties from an object to prevent Firestore errors
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
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
  const uid = getOrCreateUserId();
  const path = `${GOALS_COLL}/${uid}`;
  try {
    const docRef = doc(db, GOALS_COLL, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

/**
 * Saves/updates the user's weekly goals in Firestore
 */
export async function dbSaveWeeklyGoals(goals: any): Promise<void> {
  const uid = getOrCreateUserId();
  const path = `${GOALS_COLL}/${uid}`;
  try {
    const docRef = doc(db, GOALS_COLL, uid);
    await setDoc(docRef, sanitizeForFirestore({
      ...goals,
      userId: uid,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches activities from Firestore
 */
export async function dbFetchActivities(): Promise<any[] | null> {
  const uid = getOrCreateUserId();
  const path = `${ACTIVITIES_COLL} (list)`;
  try {
    const q = query(collection(db, ACTIVITIES_COLL), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({ ...data, id: data.id || doc.id.replace(`${uid}_`, '') });
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

/**
 * Saves a single activity to Firestore
 */
export async function dbSaveActivity(activity: any): Promise<void> {
  const uid = getOrCreateUserId();
  const docId = `${uid}_${activity.id}`;
  const path = `${ACTIVITIES_COLL}/${docId}`;
  try {
    const docRef = doc(db, ACTIVITIES_COLL, docId);
    await setDoc(docRef, sanitizeForFirestore({
      ...activity,
      userId: uid,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes an activity from Firestore
 */
export async function dbDeleteActivity(activityId: string): Promise<void> {
  const uid = getOrCreateUserId();
  const docId = `${uid}_${activityId}`;
  const path = `${ACTIVITIES_COLL}/${docId}`;
  try {
    const docRef = doc(db, ACTIVITIES_COLL, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches workout templates from Firestore
 */
export async function dbFetchTemplates(): Promise<any[] | null> {
  const uid = getOrCreateUserId();
  const path = `${TEMPLATES_COLL} (list)`;
  try {
    const q = query(collection(db, TEMPLATES_COLL), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({ ...data, id: data.id || doc.id.replace(`${uid}_`, '') });
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

/**
 * Saves a workout template to Firestore
 */
export async function dbSaveTemplate(template: any): Promise<void> {
  const uid = getOrCreateUserId();
  const docId = `${uid}_${template.id}`;
  const path = `${TEMPLATES_COLL}/${docId}`;
  try {
    const docRef = doc(db, TEMPLATES_COLL, docId);
    await setDoc(docRef, sanitizeForFirestore({
      ...template,
      userId: uid,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a workout template from Firestore
 */
export async function dbDeleteTemplate(templateId: string): Promise<void> {
  const uid = getOrCreateUserId();
  const docId = `${uid}_${templateId}`;
  const path = `${TEMPLATES_COLL}/${docId}`;
  try {
    const docRef = doc(db, TEMPLATES_COLL, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches completed workouts from Firestore
 */
export async function dbFetchCompletedWorkouts(): Promise<any[] | null> {
  const uid = getOrCreateUserId();
  const path = `${COMPLETED_COLL} (list)`;
  try {
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
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

/**
 * Saves a completed workout to Firestore
 */
export async function dbSaveCompletedWorkout(workout: any): Promise<void> {
  const uid = getOrCreateUserId();
  const docId = `${uid}_${workout.id}`;
  const path = `${COMPLETED_COLL}/${docId}`;
  try {
    const docRef = doc(db, COMPLETED_COLL, docId);
    await setDoc(docRef, sanitizeForFirestore({
      ...workout,
      userId: uid,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a completed workout from Firestore
 */
export async function dbDeleteCompletedWorkout(workoutId: string): Promise<void> {
  const uid = getOrCreateUserId();
  const docId = `${uid}_${workoutId}`;
  const path = `${COMPLETED_COLL}/${docId}`;
  try {
    const docRef = doc(db, COMPLETED_COLL, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
        await setDoc(docRef, sanitizeForFirestore({
          ...localData.weeklyGoals,
          userId: newUid,
          updatedAt: new Date().toISOString()
        }));
      }
    }

    // 2. Migrate custom and standard Activities
    for (const act of localData.activities) {
      const docId = `${newUid}_${act.id}`;
      const docRef = doc(db, ACTIVITIES_COLL, docId);
      // Only migrate if not already exists on server to prevent overwriting cloud state with local/device default
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, sanitizeForFirestore({
          ...act,
          userId: newUid,
          updatedAt: new Date().toISOString()
        }));
      }
    }

    // 3. Migrate Templates
    for (const t of localData.templates) {
      const docId = `${newUid}_${t.id}`;
      const docRef = doc(db, TEMPLATES_COLL, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, sanitizeForFirestore({
          ...t,
          userId: newUid,
          updatedAt: new Date().toISOString()
        }));
      }
    }

    // 4. Migrate Completed Workouts
    for (const comp of localData.completedWorkouts) {
      const docId = `${newUid}_${comp.id}`;
      const docRef = doc(db, COMPLETED_COLL, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, sanitizeForFirestore({
          ...comp,
          userId: newUid,
          updatedAt: new Date().toISOString()
        }));
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
