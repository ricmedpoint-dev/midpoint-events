import { db } from './config';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';

// ── Highlights ──
export async function getHighlights() {
  const q = query(collection(db, 'highlights'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Banners ──
export async function getBanners() {
  const q = query(
    collection(db, 'banners'),
    orderBy('order', 'asc'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, _collection: 'banners', ...d.data() }));
}

export async function addBanner(data) {
  const colRef = collection(db, 'banners');
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateBanner(id, data) {
  const docRef = doc(db, 'banners', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBanner(id) {
  const docRef = doc(db, 'banners', id);
  await deleteDoc(docRef);
}

// ── Events ──
export async function getEvents() {
  const q = query(collection(db, 'events'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, _collection: 'events', ...d.data() }));
}

export async function getEventBySlug(slug) {
  // First try events collection
  const qEvents = query(collection(db, 'events'), where('slug', '==', slug));
  const snapEvents = await getDocs(qEvents);
  if (!snapEvents.empty) {
    const d = snapEvents.docs[0];
    return { id: d.id, _collection: 'events', ...d.data() };
  }

  // Then try banners collection (since they are treated as upcoming events)
  // We need to check both a stored slug and a title-generated slug
  const qBanners = query(collection(db, 'banners'));
  const snapBanners = await getDocs(qBanners);

  const banner = snapBanners.docs.find(d => {
    const data = d.data();
    const bannerSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return bannerSlug === slug;
  });

  if (banner) {
    return { id: banner.id, _collection: 'banners', slug, ...banner.data() };
  }

  return null;
}

// ── Exhibitors ──
export async function getExhibitors() {
  const q = query(collection(db, 'exhibitors'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getExhibitorsByEvent(eventId) {
  if (!eventId) return [];
  const q = query(
    collection(db, 'exhibitors'),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addExhibitor(data) {
  const colRef = collection(db, 'exhibitors');
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateExhibitor(id, data) {
  const docRef = doc(db, 'exhibitors', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExhibitor(id) {
  const docRef = doc(db, 'exhibitors', id);
  await deleteDoc(docRef);
}

// ── About Text ──
export async function getAboutText() {
  const ref = doc(db, 'content', 'about');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

// ── Registrants ──
export async function registerParticipant(eventId, type, data) {
  if (!eventId || !type) throw new Error("Missing eventId or registration type");

  const sequenceRef = doc(db, 'counters', 'registrationSequence');
  const currentYear = new Date().getFullYear().toString();
  const collectionName = type === 'individual' ? 'registrants_individual' : 'registrants_school';
  const emailId = data.email.toLowerCase().replace(/\s+/g, '');

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get the event code
      let eventCode = 'GCC'; // Default fallback
      const bannerRef = doc(db, 'banners', eventId);
      const bannerSnap = await transaction.get(bannerRef);
      if (bannerSnap.exists()) {
        eventCode = bannerSnap.data().eventCode || 'GCC';
      } else {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await transaction.get(eventRef);
        if (eventSnap.exists()) {
          eventCode = eventSnap.data().eventCode || 'GCC';
        }
      }

      // 2. Get the current global sequence number
      const sequenceSnap = await transaction.get(sequenceRef);
      let nextValue = 1;

      if (sequenceSnap.exists()) {
        nextValue = sequenceSnap.data().lastValue + 1;
      }

      // 3. Format the code (e.g., GCCAD-0000012026)
      const registrationCode = `${eventCode}-${String(nextValue).padStart(6, '0')}${currentYear}`;

      // 4. Create the registration document using email as ID
      // Path: events/{year}/{eventCode}/{type}/registrants/{email}
      const newDocRef = doc(db, 'events', currentYear, eventCode, collectionName, 'registrants', emailId);

      transaction.set(newDocRef, {
        ...data,
        registrationCode,
        createdAt: new Date().toISOString(),
      });

      // 5. Update the sequence counter
      transaction.set(sequenceRef, { lastValue: nextValue }, { merge: true });

      return { id: emailId, registrationCode };
    });
  } catch (error) {
    console.error("Error in registerParticipant transaction:", error);
    throw error;
  }
}

export async function addRegistrant(data) {
  const colRef = collection(db, 'registrants');
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

// ── Enquiries ──
export async function addEnquiry(data) {
  const colRef = collection(db, 'enquiries');
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

// ── Users / Profile ──
export async function updateProfile(uid, data) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function getUserProfile(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data();
}

// ── Social Features (Likes & Comments) ──

/**
 * Toggles a like for a banner. 
 * If liked, removes it and decrements count.
 * If not liked, adds it and increments count.
 */
export async function toggleLike(bannerId, userId) {
  if (!bannerId || !userId) return;

  const likeId = `${bannerId}_${userId}`;
  const likeRef = doc(db, 'likes', likeId);
  const bannerRef = doc(db, 'banners', bannerId);

  try {
    await runTransaction(db, async (transaction) => {
      const likeSnap = await transaction.get(likeRef);

      if (likeSnap.exists()) {
        // Unlike
        transaction.delete(likeRef);
        transaction.update(bannerRef, {
          likesCount: increment(-1)
        });
      } else {
        // Like
        transaction.set(likeRef, {
          bannerId,
          userId,
          createdAt: new Date().toISOString()
        });
        transaction.update(bannerRef, {
          likesCount: increment(1)
        });
      }
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
}

export async function checkIfLiked(bannerId, userId) {
  if (!bannerId || !userId) return false;
  const likeId = `${bannerId}_${userId}`;
  const likeRef = doc(db, 'likes', likeId);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

/**
 * Adds a comment to a banner and increments count.
 */
export async function addComment(bannerId, commentData) {
  if (!bannerId) return;

  const commentsCol = collection(db, 'comments');
  const bannerRef = doc(db, 'banners', bannerId);

  try {
    const docRef = await addDoc(commentsCol, {
      bannerId,
      ...commentData,
      createdAt: new Date().toISOString()
    });

    await updateDoc(bannerRef, {
      commentsCount: increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

/**
 * Returns a real-time listener for comments on a specific banner.
 */
export function subscribeToComments(bannerId, callback) {
  if (!bannerId) return () => { };

  const q = query(
    collection(db, 'comments'),
    where('bannerId', '==', bannerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(comments);
  });
}

/**
 * Deletes a comment and decrements the counter.
 */
export async function deleteComment(commentId, bannerId) {
  if (!commentId || !bannerId) return;

  const commentRef = doc(db, 'comments', commentId);
  const bannerRef = doc(db, 'banners', bannerId);

  try {
    await runTransaction(db, async (transaction) => {
      const commentSnap = await transaction.get(commentRef);
      if (!commentSnap.exists()) return;

      transaction.delete(commentRef);
      transaction.update(bannerRef, {
        commentsCount: increment(-1)
      });
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// ── Floor Plans ──

/**
 * Saves or updates a floor plan for an event.
 * Stored in floorplans/{eventId}
 */
export async function saveFloorPlan(eventId, floorPlanData) {
  if (!eventId) throw new Error("Missing eventId");
  const docRef = doc(db, 'floorplans', eventId);
  await setDoc(docRef, {
    ...floorPlanData,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

/**
 * Gets the floor plan for an event.
 */
export async function getFloorPlan(eventId) {
  if (!eventId) return null;
  const docRef = doc(db, 'floorplans', eventId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Deletes the floor plan for an event.
 */
export async function deleteFloorPlan(eventId) {
  if (!eventId) return;
  const docRef = doc(db, 'floorplans', eventId);
  await deleteDoc(docRef);
}
