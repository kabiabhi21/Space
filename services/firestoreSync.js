// services/firestoreSync.js
import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
} from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys for offline cache
const SYNC_QUEUE_KEY = "@firestore_sync_queue";
const LAST_SYNC_KEY = "@firestore_last_sync";

class FirestoreSyncService {
  constructor() {
    this.currentUser = null;
    this.syncInProgress = false;
    console.log("🔥 FirestoreSyncService initialized");
  }

  setCurrentUser(user) {
    console.log("👤 setCurrentUser called with:", user?.uid || "null");
    this.currentUser = user;
    console.log("✅ currentUser set to:", this.currentUser?.uid || "null");
  }

  getUserCollectionPath(collectionName) {
    if (!this.currentUser) {
      console.error("❌ getUserCollectionPath: No user logged in!");
      throw new Error("No user logged in");
    }
    const path = `users/${this.currentUser.uid}/${collectionName}`;
    console.log(`📁 getUserCollectionPath: ${collectionName} -> ${path}`);
    return path;
  }

  // ============ NOTES SYNC ============
  async syncNotes(notes) {
    console.log(`📝 syncNotes called with ${notes?.length || 0} notes`);
    console.log("   Current user:", this.currentUser?.uid || "null");

    if (!this.currentUser) {
      console.error("❌ syncNotes: No current user!");
      return false;
    }

    try {
      const collectionPath = this.getUserCollectionPath("notes");
      console.log("   Collection path:", collectionPath);

      const userNotesRef = collection(db, collectionPath);
      const batch = writeBatch(db);

      // Get existing notes from Firestore
      console.log("   Fetching existing notes from Firestore...");
      const existingNotesSnapshot = await getDocs(userNotesRef);
      const existingNoteIds = new Set(
        existingNotesSnapshot.docs.map((doc) => doc.id),
      );
      console.log(
        `   Found ${existingNoteIds.size} existing notes in Firestore`,
      );

      // Update or add notes
      let notesToSync = 0;
      for (const note of notes) {
        const noteRef = doc(db, `${collectionPath}/${note.id.toString()}`);
        const noteData = {
          ...note,
          id: note.id.toString(),
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.uid,
        };
        batch.set(noteRef, noteData, { merge: true });
        existingNoteIds.delete(note.id.toString());
        notesToSync++;
      }
      console.log(`   Synced ${notesToSync} notes to Firestore`);

      // Delete notes that no longer exist locally
      let deletedCount = 0;
      // for (const noteId of existingNoteIds) {
      //   const noteRef = doc(db, `${collectionPath}/${noteId}`);
      //   batch.delete(noteRef);
      //   deletedCount++;
      // }
      if (deletedCount > 0) {
        console.log(`   Deleted ${deletedCount} notes from Firestore`);
      }

      console.log("   Committing batch...");
      await batch.commit();
      console.log("✅ syncNotes completed successfully");
      await this.updateSyncStatus("notes", notes.length);
      return true;
    } catch (error) {
      console.error("❌ Error syncing notes to Firestore:", error);
      console.error("   Error details:", error.message, error.stack);
      return false;
    }
  }

  async loadNotesFromFirestore() {
    console.log("📥 loadNotesFromFirestore called");

    if (!this.currentUser) {
      console.error("❌ loadNotesFromFirestore: No user!");
      return null;
    }

    try {
      const collectionPath = this.getUserCollectionPath("notes");
      console.log("   Collection path:", collectionPath);

      const userNotesRef = collection(db, collectionPath);
      const notesSnapshot = await getDocs(userNotesRef);
      console.log(`   Found ${notesSnapshot.docs.length} notes in Firestore`);

      const notes = [];

      notesSnapshot.forEach((doc) => {
        const noteData = doc.data();
        notes.push({
          ...noteData,
          id: parseInt(noteData.id) || noteData.id,
        });
      });
      console.log(`✅ Loaded ${notes.length} notes from Firestore`);

      // Sort by date (newest first)
      notes.sort((a, b) => {
        const dateA = new Date(a.date?.split("-").reverse().join("-") || 0);
        const dateB = new Date(b.date?.split("-").reverse().join("-") || 0);
        return dateB - dateA;
      });

      return notes;
    } catch (error) {
      console.error("❌ Error loading notes from Firestore:", error);
      return null;
    }
  }

  // ============ LISTS SYNC ============
  async syncLists(lists) {
    console.log(`📋 syncLists called with ${lists?.length || 0} lists`);

    if (!this.currentUser) return false;

    try {
      const collectionPath = this.getUserCollectionPath("lists");
      const userListsRef = collection(db, collectionPath);
      const batch = writeBatch(db);

      const existingListsSnapshot = await getDocs(userListsRef);
      const existingListIds = new Set(
        existingListsSnapshot.docs.map((doc) => doc.id),
      );

      for (const list of lists) {
        const listRef = doc(db, `${collectionPath}/${list.id.toString()}`);
        const listData = {
          ...list,
          id: list.id.toString(),
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.uid,
        };
        batch.set(listRef, listData, { merge: true });
        existingListIds.delete(list.id.toString());
      }

      // for (const listId of existingListIds) {
      //   const listRef = doc(db, `${collectionPath}/${listId}`);
      //   batch.delete(listRef);
      // }

      await batch.commit();
      console.log("✅ syncLists completed");
      await this.updateSyncStatus("lists", lists.length);
      return true;
    } catch (error) {
      console.error("❌ Error syncing lists:", error);
      return false;
    }
  }

  async loadListsFromFirestore() {
    if (!this.currentUser) return null;

    try {
      const collectionPath = this.getUserCollectionPath("lists");
      const userListsRef = collection(db, collectionPath);
      const listsSnapshot = await getDocs(userListsRef);
      const lists = [];

      listsSnapshot.forEach((doc) => {
        const listData = doc.data();
        lists.push({
          ...listData,
          id: parseInt(listData.id) || listData.id,
          tasks: listData.tasks || [],
        });
      });

      lists.sort((a, b) => {
        const dateA = new Date(a.date?.split("-").reverse().join("-") || 0);
        const dateB = new Date(b.date?.split("-").reverse().join("-") || 0);
        return dateB - dateA;
      });

      return lists;
    } catch (error) {
      console.error("Error loading lists from Firestore:", error);
      return null;
    }
  }

  // ============ CALENDAR EVENTS SYNC ============
  async syncCalendarEvents(events) {
    if (!this.currentUser) return false;

    try {
      const collectionPath = this.getUserCollectionPath("calendarEvents");
      const userEventsRef = collection(db, collectionPath);
      const batch = writeBatch(db);

      const existingEventsSnapshot = await getDocs(userEventsRef);
      const existingEventIds = new Set(
        existingEventsSnapshot.docs.map((doc) => doc.id),
      );

      for (const event of events) {
        const eventRef = doc(db, `${collectionPath}/${event.id.toString()}`);
        const eventData = {
          ...event,
          id: event.id.toString(),
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.uid,
        };
        batch.set(eventRef, eventData, { merge: true });
        existingEventIds.delete(event.id.toString());
      }

      // for (const eventId of existingEventIds) {
      //   const eventRef = doc(db, `${collectionPath}/${eventId}`);
      //   batch.delete(eventRef);
      // }

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error syncing calendar events:", error);
      return false;
    }
  }

  async loadCalendarEventsFromFirestore() {
    if (!this.currentUser) return null;

    try {
      const collectionPath = this.getUserCollectionPath("calendarEvents");
      const userEventsRef = collection(db, collectionPath);
      const eventsSnapshot = await getDocs(userEventsRef);
      const events = [];

      eventsSnapshot.forEach((doc) => {
        const eventData = doc.data();
        events.push({
          ...eventData,
          id: parseInt(eventData.id) || eventData.id,
          startDate: parseInt(eventData.startDate),
          endDate: parseInt(eventData.endDate),
        });
      });

      return events;
    } catch (error) {
      console.error("Error loading calendar events:", error);
      return null;
    }
  }

  // ============ CALENDAR MOODS SYNC ============
  async syncCalendarMoods(moods) {
    if (!this.currentUser) return false;

    try {
      const collectionPath = this.getUserCollectionPath("calendarMoods");
      const userMoodsRef = collection(db, collectionPath);
      const batch = writeBatch(db);

      const existingMoodsSnapshot = await getDocs(userMoodsRef);
      const existingMoodIds = new Set(
        existingMoodsSnapshot.docs.map((doc) => doc.id),
      );

      for (const mood of moods) {
        const moodRef = doc(db, `${collectionPath}/${mood.id.toString()}`);
        const moodData = {
          ...mood,
          id: mood.id.toString(),
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.uid,
        };
        batch.set(moodRef, moodData, { merge: true });
        existingMoodIds.delete(mood.id.toString());
      }

      // for (const moodId of existingMoodIds) {
      //   const moodRef = doc(db, `${collectionPath}/${moodId}`);
      //   batch.delete(moodRef);
      // }

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error syncing calendar moods:", error);
      return false;
    }
  }

  async loadCalendarMoodsFromFirestore() {
    if (!this.currentUser) return null;

    try {
      const collectionPath = this.getUserCollectionPath("calendarMoods");
      const userMoodsRef = collection(db, collectionPath);
      const moodsSnapshot = await getDocs(userMoodsRef);
      const moods = [];

      moodsSnapshot.forEach((doc) => {
        const moodData = doc.data();
        moods.push({
          ...moodData,
          id: parseInt(moodData.id) || moodData.id,
        });
      });

      return moods;
    } catch (error) {
      console.error("Error loading calendar moods:", error);
      return null;
    }
  }

  // ============ CALENDAR DATE COLORS SYNC ============
  async syncCalendarDateColors(dateColors) {
    if (!this.currentUser) return false;

    try {
      const colorsRef = doc(
        db,
        `users/${this.currentUser.uid}/metadata/dateColors`,
      );
      await setDoc(
        colorsRef,
        {
          colors: dateColors,
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.uid,
        },
        { merge: true },
      );
      return true;
    } catch (error) {
      console.error("Error syncing date colors:", error);
      return false;
    }
  }

  async loadCalendarDateColorsFromFirestore() {
    if (!this.currentUser) return null;

    try {
      const colorsRef = doc(
        db,
        `users/${this.currentUser.uid}/metadata/dateColors`,
      );
      const colorsDoc = await getDoc(colorsRef);
      if (colorsDoc.exists()) {
        return colorsDoc.data().colors || {};
      }
      return {};
    } catch (error) {
      console.error("Error loading date colors:", error);
      return null;
    }
  }

  // ============ MINDMAPS SYNC ============
  async syncMindmaps(mindmaps) {
    if (!this.currentUser) return false;

    try {
      const collectionPath = this.getUserCollectionPath("mindmaps");
      const userMindmapsRef = collection(db, collectionPath);
      const batch = writeBatch(db);

      const existingMindmapsSnapshot = await getDocs(userMindmapsRef);
      const existingMindmapIds = new Set(
        existingMindmapsSnapshot.docs.map((doc) => doc.id),
      );

      for (const mindmap of mindmaps) {
        const mindmapRef = doc(
          db,
          `${collectionPath}/${mindmap.id.toString()}`,
        );
        const mindmapData = {
          ...mindmap,
          id: mindmap.id.toString(),
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.uid,
        };
        batch.set(mindmapRef, mindmapData, { merge: true });
        existingMindmapIds.delete(mindmap.id.toString());
      }

      // for (const mindmapId of existingMindmapIds) {
      //   const mindmapRef = doc(db, `${collectionPath}/${mindmapId}`);
      //   batch.delete(mindmapRef);
      // }

      await batch.commit();
      console.log("✅ syncMindmaps completed");
      await this.updateSyncStatus("mindmaps", mindmaps.length);
      return true;
    } catch (error) {
      console.error("Error syncing mindmaps:", error);
      return false;
    }
  }

  async loadMindmapsFromFirestore() {
    if (!this.currentUser) return null;

    try {
      const collectionPath = this.getUserCollectionPath("mindmaps");
      const userMindmapsRef = collection(db, collectionPath);
      const mindmapsSnapshot = await getDocs(userMindmapsRef);
      const mindmaps = [];

      mindmapsSnapshot.forEach((doc) => {
        const mindmapData = doc.data();
        mindmaps.push({
          ...mindmapData,
          id: mindmapData.id,
        });
      });

      return mindmaps;
    } catch (error) {
      console.error("Error loading mindmaps:", error);
      return null;
    }
  }

  // ============ FULL SYNC ============
  async syncAllData(data) {
    console.log("🔄 syncAllData called");
    console.log("   User:", this.currentUser?.uid);
    console.log("   Notes count:", data.notes?.length || 0);
    console.log("   Lists count:", data.lists?.length || 0);

    if (!this.currentUser) {
      console.error("❌ syncAllData: No user!");
      return false;
    }

    if (this.syncInProgress) {
      console.log("⏳ Sync already in progress, skipping...");
      return false;
    }

    this.syncInProgress = true;
    console.log("🚀 Starting full sync...");

    try {
      const results = await Promise.all([
        this.syncNotes(data.notes),
        this.syncLists(data.lists),
        this.syncCalendarEvents(data.events),
        this.syncCalendarMoods(data.moods),
        this.syncCalendarDateColors(data.dateColors),
        this.syncMindmaps(data.mindmaps),
      ]);

      console.log("✅ Full sync results:", results);
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      return true;
    } catch (error) {
      console.error("❌ Error in full sync:", error);
      return false;
    } finally {
      this.syncInProgress = false;
      console.log("🏁 Sync finished");
    }
  }

  async loadAllDataFromFirestore() {
    console.log("📥 loadAllDataFromFirestore called");

    if (!this.currentUser) {
      console.error("❌ No user to load data from Firestore!");
      return null;
    }

    try {
      console.log("   Loading data for user:", this.currentUser.uid);
      const [notes, lists, events, moods, dateColors, mindmaps] =
        await Promise.all([
          this.loadNotesFromFirestore(),
          this.loadListsFromFirestore(),
          this.loadCalendarEventsFromFirestore(),
          this.loadCalendarMoodsFromFirestore(),
          this.loadCalendarDateColorsFromFirestore(),
          this.loadMindmapsFromFirestore(),
        ]);

      console.log("✅ Data loaded from Firestore:");
      console.log("   Notes:", notes?.length || 0);
      console.log("   Lists:", lists?.length || 0);
      console.log("   Events:", events?.length || 0);
      console.log("   Moods:", moods?.length || 0);
      console.log("   Mindmaps:", mindmaps?.length || 0);

      return {
        notes: notes || [],
        lists: lists || [],
        events: events || [],
        moods: moods || [],
        dateColors: dateColors || {},
        mindmaps: mindmaps || [],
      };
    } catch (error) {
      console.error("❌ Error loading all data from Firestore:", error);
      return null;
    }
  }

  async updateSyncStatus(dataType, count) {
    try {
      const statusRef = doc(
        db,
        `users/${this.currentUser.uid}/metadata/syncStatus`,
      );
      await setDoc(
        statusRef,
        {
          [dataType]: {
            lastSynced: new Date().toISOString(),
            count: count,
          },
          lastFullSync: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating sync status:", error);
    }
  }

  async queueSyncOperation(data) {
    try {
      const currentQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = currentQueue ? JSON.parse(currentQueue) : [];
      queue.push({
        timestamp: new Date().toISOString(),
        data: data,
      });
      await AsyncStorage.setItem(
        SYNC_QUEUE_KEY,
        JSON.stringify(queue.slice(-10)),
      );
      console.log("📦 Data queued for offline sync");
    } catch (error) {
      console.error("Error queueing sync operation:", error);
    }
  }

  async processOfflineQueue() {
    try {
      const currentQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (currentQueue) {
        const queue = JSON.parse(currentQueue);
        console.log(`🔄 Processing ${queue.length} queued sync operations`);
        for (const item of queue) {
          await this.syncAllData(item.data);
        }
        await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
        console.log("✅ Offline queue processed");
      }
    } catch (error) {
      console.error("Error processing offline queue:", error);
    }
  }
}

export default new FirestoreSyncService();
