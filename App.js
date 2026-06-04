// App.js - Add ListEditor import and screen
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import { onAuthStateChanged } from "./services/firebase";
import firestoreSync from "./services/firestoreSync";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Notes, { NoteEditorScreen } from "./components/Notes";
import List, { ListEditorScreen } from "./components/List";
import Calendar from "./components/Calendar";
import Mindmap from "./components/Mindmap";
import Login from "./components/Login";
import Settings from "./components/Settings";
import Archive from "./components/Archive";
import Deleted from "./components/Deleted";

const Stack = createNativeStackNavigator();

// Configure notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const THEME_STORAGE_KEY = "@app_theme";
const REMINDERS_STORAGE_KEY = "@calendar_reminders";

function MainApp() {
  // UI States
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("Notes");
  const [editingPostColor, setEditingPostColor] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Notes States
  const [notes, setNotes] = useState([]);
  const [notesSearchTerm, setNotesSearchTerm] = useState("");
  const [notesShowSearch, setNotesShowSearch] = useState(false);

  // Lists States
  const [lists, setLists] = useState([]);
  const [listsSearchTerm, setListsSearchTerm] = useState("");
  const [listsShowSearch, setListsShowSearch] = useState(false);

  // Calendar States
  const [events, setEvents] = useState([]);
  const [moods, setMoods] = useState([]);
  const [dateColors, setDateColors] = useState({});
  const [calendarCurrentView, setCalendarCurrentView] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearViewYear, setYearViewYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventViewerActive, setEventViewerActive] = useState(false);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteWarningActive, setDeleteWarningActive] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [viewerBg, setViewerBg] = useState("#000033");

  // Mindmap States
  const [mindmaps, setMindmaps] = useState([]);
  const [activeMindmap, setActiveMindmap] = useState(null);
  const [mindmapMode, setMindmapMode] = useState("idle");
  const [mindmapInput, setMindmapInput] = useState({});
  const [mindmapScale, setMindmapScale] = useState(1);
  const [openColorNode, setOpenColorNode] = useState(null);
  const [isMindmapAuthenticated, setIsMindmapAuthenticated] = useState(false);

  // Reminders States
  const [reminders, setReminders] = useState([]);
  const notificationListener = useRef();
  const responseListener = useRef();

  // updateFontSize function
  const updateFontSize = (id, type) => {
    setNotes((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newSize = item.font ?? 19;

        if (type === "increase" && newSize < 25) {
          newSize++;
        }

        if (type === "decrease" && newSize > 12) {
          newSize--;
        }

        console.log("new font =", newSize);

        return {
          ...item,
          font: newSize,
        };
      }),
    );
  };

  // Debounce timer for auto-sync
  const syncTimeoutRef = useRef(null);

  // Storage Keys for AsyncStorage backup
  const STORAGE_KEYS = {
    NOTES: "@posts",
    LISTS: "@lists",
    CALENDAR_EVENTS: "@calendar_events",
    CALENDAR_MOODS: "@calendar_moods",
    CALENDAR_DATE_COLORS: "@calendar_date_colors",
    MINDMAPS: "@mindmaps",
    REMINDERS: "@calendar_reminders",
  };

  // Load theme from AsyncStorage on app start
  useEffect(() => {
    loadTheme();
    setupNotificationListeners();
    loadRemindersFromStorage();
    checkNotificationPermissions();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Setup notification listeners
  const setupNotificationListeners = () => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification clicked:", response);
        const { data } = response.notification.request.content;
        if (data && data.year && data.month !== undefined && data.date) {
          // Navigate to calendar and show the specific date
          setCurrentScreen("Calendar");
          setCurrentYear(data.year);
          setCurrentMonth(data.month);
          setSelectedDate(data.date);
          setEventViewerActive(true);
        }
      });
  };

  // Check notification permissions on app start
  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && Platform.OS === "android") {
      console.log("Notifications permission not granted yet");
    }
  };

  // Load saved reminders from storage
  const loadRemindersFromStorage = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders);
        setReminders(parsedReminders);
        reScheduleReminders(parsedReminders);
      }
    } catch (error) {
      console.error("Error loading reminders:", error);
    }
  };

  // Re-schedule reminders on app start
  const reScheduleReminders = async (remindersList) => {
    const now = new Date();
    for (const reminder of remindersList) {
      const reminderDate = new Date(reminder.scheduledTime);
      if (reminderDate > now && reminder.status === "scheduled") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
            data: reminder.data,
          },
          trigger: {
            date: reminderDate,
          },
        });
      }
    }
  };

  // Save reminder to storage
  const saveReminderToStorage = async (reminder) => {
    try {
      const updatedReminders = [...reminders, reminder];
      setReminders(updatedReminders);
      await AsyncStorage.setItem(
        STORAGE_KEYS.REMINDERS,
        JSON.stringify(updatedReminders),
      );
    } catch (error) {
      console.error("Error saving reminder:", error);
    }
  };

  // Update reminder status
  const updateReminderStatus = async (reminderId, status) => {
    try {
      const updatedReminders = reminders.map((r) =>
        r.id === reminderId ? { ...r, status } : r,
      );
      setReminders(updatedReminders);
      await AsyncStorage.setItem(
        STORAGE_KEYS.REMINDERS,
        JSON.stringify(updatedReminders),
      );
    } catch (error) {
      console.error("Error updating reminder:", error);
    }
  };

  // Schedule a new reminder
  const scheduleReminder = async (reminderData) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable notifications to set reminders",
        );
        return false;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("calendar_reminders", {
          name: "Calendar Reminders",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#000033",
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderData.title,
          body: reminderData.body,
          data: reminderData.data,
        },
        trigger: {
          date: reminderData.triggerDate,
        },
      });

      const newReminder = {
        id: notificationId,
        ...reminderData,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      await saveReminderToStorage(newReminder);

      return true;
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      Alert.alert("Error", "Failed to set reminder. Please try again.");
      return false;
    }
  };

  // Cancel a reminder
  const cancelReminder = async (reminderId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      await updateReminderStatus(reminderId, "cancelled");
      return true;
    } catch (error) {
      console.error("Error cancelling reminder:", error);
      return false;
    }
  };

  // Cancel all reminders for a specific date
  const cancelRemindersForDate = async (year, month, date) => {
    const remindersForDate = reminders.filter(
      (r) =>
        r.data &&
        r.data.year === year &&
        r.data.month === month &&
        r.data.date === date &&
        r.status === "scheduled",
    );

    for (const reminder of remindersForDate) {
      await cancelReminder(reminder.id);
    }
  };

  // Get reminders for a specific date
  const getRemindersForDate = (year, month, date) => {
    return reminders.filter(
      (r) =>
        r.data &&
        r.data.year === year &&
        r.data.month === month &&
        r.data.date === date &&
        r.status === "scheduled",
    );
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      firestoreSync.setCurrentUser(authUser);

      if (authUser) {
        const hasFirestoreData = await loadDataFromFirestore();

        if (!hasFirestoreData) {
          await loadFromAsyncStorageBackup();
          await migrateExistingDataToFirestore();
        }
      } else {
        clearLocalData();
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Setup network listener
  useEffect(() => {
    let isMounted = true;
    let interval;

    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const wasOnline = isOnline;
        const nowOnline =
          networkState.isConnected &&
          networkState.isInternetReachable !== false;

        if (isMounted) {
          setIsOnline(nowOnline);

          if (!wasOnline && nowOnline && user) {
            console.log("Network reconnected, syncing...");
            await syncToFirestore();
            await firestoreSync.processOfflineQueue();
          }
        }
      } catch (error) {
        console.error("Network check error:", error);
        if (isMounted) {
          setIsOnline(true);
        }
      }
    };

    interval = setInterval(checkNetwork, 5000);
    checkNetwork();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [isOnline, user]);

  // Auto-sync to Firestore when data changes (with debounce)
  useEffect(() => {
    console.log("AUTO SYNC EFFECT");
    if (user && !isLoading) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToFirestore();
      }, 2000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [notes, lists, events, moods, dateColors, mindmaps]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkTheme(savedTheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  };

  const saveTheme = async (isDark) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const loadDataFromFirestore = async () => {
    setIsSyncing(true);
    try {
      const data = await firestoreSync.loadAllDataFromFirestore();

      if (
        data &&
        (data.notes.length > 0 ||
          data.lists.length > 0 ||
          data.events.length > 0 ||
          data.mindmaps.length > 0)
      ) {
        setNotes(data.notes);
        setLists(data.lists);
        setEvents(data.events);
        setMoods(data.moods);
        setDateColors(data.dateColors);
        setMindmaps(data.mindmaps);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading from Firestore:", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromAsyncStorageBackup = async () => {
    await Promise.all([
      loadNotesFromAsync(),
      loadListsFromAsync(),
      loadCalendarEventsFromAsync(),
      loadCalendarMoodsFromAsync(),
      loadCalendarDateColorsFromAsync(),
      loadMindmapsFromAsync(),
    ]);
  };

  const loadNotesFromAsync = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      if (savedNotes !== null) {
        const parsedNotes = JSON.parse(savedNotes);
        const migratedNotes = migrateOldNotes(parsedNotes);
        setNotes(migratedNotes);
      }
    } catch (error) {
      console.error("Error loading notes from AsyncStorage:", error);
    }
  };

  const loadListsFromAsync = async () => {
    try {
      const savedLists = await AsyncStorage.getItem(STORAGE_KEYS.LISTS);
      if (savedLists !== null) {
        const parsedLists = JSON.parse(savedLists);
        const migratedLists = migrateOldLists(parsedLists);
        setLists(migratedLists);
      }
    } catch (error) {
      console.error("Error loading lists from AsyncStorage:", error);
    }
  };

  const loadCalendarEventsFromAsync = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem(
        STORAGE_KEYS.CALENDAR_EVENTS,
      );
      if (savedEvents) setEvents(JSON.parse(savedEvents));
    } catch (error) {
      console.error("Error loading calendar events from AsyncStorage:", error);
    }
  };

  const loadCalendarMoodsFromAsync = async () => {
    try {
      const savedMoods = await AsyncStorage.getItem(
        STORAGE_KEYS.CALENDAR_MOODS,
      );
      if (savedMoods) setMoods(JSON.parse(savedMoods));
    } catch (error) {
      console.error("Error loading calendar moods from AsyncStorage:", error);
    }
  };

  const loadCalendarDateColorsFromAsync = async () => {
    try {
      const savedDateColors = await AsyncStorage.getItem(
        STORAGE_KEYS.CALENDAR_DATE_COLORS,
      );
      if (savedDateColors) setDateColors(JSON.parse(savedDateColors));
    } catch (error) {
      console.error(
        "Error loading calendar date colors from AsyncStorage:",
        error,
      );
    }
  };

  const loadMindmapsFromAsync = async () => {
    try {
      const savedMindmaps = await AsyncStorage.getItem(STORAGE_KEYS.MINDMAPS);
      if (savedMindmaps) {
        const parsedMindmaps = JSON.parse(savedMindmaps);
        const migratedMindmaps = migrateOldMindmaps(parsedMindmaps);
        setMindmaps(migratedMindmaps);
      }
    } catch (error) {
      console.error("Error loading mindmaps from AsyncStorage:", error);
    }
  };

  const syncToFirestore = async () => {
    console.log("SYNC STARTED", new Date().toISOString());
    if (!user || !isOnline) {
      if (!isOnline && user) {
        await firestoreSync.queueSyncOperation({
          notes,
          lists,
          events,
          moods,
          dateColors,
          mindmaps,
        });
      }
      return;
    }

    try {
      const syncData = {
        notes: notes,
        lists: lists,
        events: events,
        moods: moods,
        dateColors: dateColors,
        mindmaps: mindmaps,
      };
      await firestoreSync.syncAllData(syncData);
    } catch (error) {
      console.error("Error syncing to Firestore:", error);
      await firestoreSync.queueSyncOperation({
        notes,
        lists,
        events,
        moods,
        dateColors,
        mindmaps,
      });
    }
  };

  const migrateExistingDataToFirestore = async () => {
    if (!user) return;

    try {
      if (
        notes.length > 0 ||
        lists.length > 0 ||
        events.length > 0 ||
        mindmaps.length > 0
      ) {
        await firestoreSync.syncAllData({
          notes,
          lists,
          events,
          moods,
          dateColors,
          mindmaps,
        });
        console.log("Migration completed successfully!");
      }
    } catch (error) {
      console.error("Migration error:", error);
    }
  };

  const clearLocalData = () => {
    setNotes([]);
    setLists([]);
    setEvents([]);
    setMoods([]);
    setDateColors({});
    setMindmaps([]);
    setActiveMindmap(null);
    setMindmapMode("idle");
  };

  const migrateOldNotes = (oldNotes) => {
    const COLOR_ARRAY = [
      { bg: "#e5e3e3", text: "#202124" },
      { bg: "#1A237E", text: "#E8EAF6" },
      { bg: "#1B5E20", text: "#E8F5E9" },
      { bg: "#0D47A1", text: "#E3F2FD" },
      { bg: "#4A148C", text: "#F3E5F5" },
      { bg: "#311B92", text: "#EDE7F6" },
      { bg: "#B71C1C", text: "#FFEBEE" },
      { bg: "#3E2723", text: "#EFEBE9" },
      { bg: "#263238", text: "#ECEFF1" },
      { bg: "#000000", text: "#E0E0E0" },
    ];

    return oldNotes.map((note) => {
      if (note.colorIndex !== undefined) {
        return {
          ...note,
          pinned: note.pinned || false,
          title: note.title || "Untitled",
          deleteStatus: note.deleteStatus || "active",
          status: note.status || "unarchived",
          font: note.font || 19,
        };
      }

      let colorIndex = 0;
      if (note.color === "#000033" && note.textcolor === "white") {
        colorIndex = 1;
      } else if (note.color === "white" && note.textcolor === "gray") {
        colorIndex = 0;
      }

      return {
        ...note,
        colorIndex: colorIndex,
        pinned: false,
        title: note.title || "Untitled",
        deleteStatus: note.deleteStatus || "active",
        status: note.status || "unarchived",
        font: note.font || 19,
      };
    });
  };

  const migrateOldLists = (oldLists) => {
    const COLOR_ARRAY = [
      { bg: "#e5e3e3", text: "#202124" },
      { bg: "#1A237E", text: "#E8EAF6" },
      { bg: "#1B5E20", text: "#E8F5E9" },
      { bg: "#0D47A1", text: "#E3F2FD" },
      { bg: "#4A148C", text: "#F3E5F5" },
      { bg: "#311B92", text: "#EDE7F6" },
      { bg: "#B71C1C", text: "#FFEBEE" },
      { bg: "#3E2723", text: "#EFEBE9" },
      { bg: "#263238", text: "#ECEFF1" },
      { bg: "#000000", text: "#E0E0E0" },
    ];

    return oldLists.map((list) => {
      if (list.colorIndex !== undefined) {
        return {
          ...list,
          pinned: list.pinned || false,
          title: list.title || "Untitled List",
          tasks: list.tasks || [],
          deleteStatus: list.deleteStatus || "active",
          status: list.status || "unarchived",
        };
      }

      let colorIndex = 0;
      if (list.color === "#000033" && list.textcolor === "white") {
        colorIndex = 1;
      } else if (list.color === "white" && list.textcolor === "gray") {
        colorIndex = 0;
      }

      return {
        ...list,
        colorIndex: colorIndex,
        pinned: false,
        title: list.title || "Untitled List",
        tasks: list.tasks || [],
        deleteStatus: list.deleteStatus || "active",
        status: list.status || "unarchived",
      };
    });
  };

  const migrateOldMindmaps = (oldMindmaps) => {
    return oldMindmaps.map((map) => ({
      ...map,
      deleteStatus: map.deleteStatus || "active",
      status: map.status || "unarchived",
    }));
  };

  // Notes CRUD Operations
  const createNote = () => {
    const COLOR_ARRAY = [
      { bg: "#e5e3e3", text: "#202124" },
      { bg: "#1A237E", text: "#E8EAF6" },
      { bg: "#1B5E20", text: "#E8F5E9" },
      { bg: "#0D47A1", text: "#E3F2FD" },
      { bg: "#4A148C", text: "#F3E5F5" },
      { bg: "#311B92", text: "#EDE7F6" },
      { bg: "#B71C1C", text: "#FFEBEE" },
      { bg: "#3E2723", text: "#EFEBE9" },
      { bg: "#263238", text: "#ECEFF1" },
      { bg: "#000000", text: "#E0E0E0" },
    ];

    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const time = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const newNote = {
      title: "Untitled",
      sentence: "",
      time: time,
      date: dateStr,
      colorIndex: 0,
      color: COLOR_ARRAY[0].bg,
      textcolor: COLOR_ARRAY[0].text,
      id: Date.now(),
      pinned: false,
      deleteStatus: "active",
      status: "unarchived",
      font: 16,
    };

    setNotes((prev) => [...prev, newNote]);
  };

  const updateNote = (noteId, updates) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, ...updates } : note)),
    );
  };

  const deleteNote = (noteId) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, deleteStatus: "deleted" } : note,
      ),
    );
  };

  const archiveNote = (noteId) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              status: note.status === "archived" ? "unarchived" : "archived",
            }
          : note,
      ),
    );
  };

  const restoreNote = (noteId) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, deleteStatus: "active" } : note,
      ),
    );
  };

  const permanentDeleteNote = (noteId) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const changeNoteColor = (noteId) => {
    const COLOR_ARRAY = [
      { bg: "#e5e3e3", text: "#202124" },
      { bg: "#1A237E", text: "#E8EAF6" },
      { bg: "#1B5E20", text: "#E8F5E9" },
      { bg: "#0D47A1", text: "#E3F2FD" },
      { bg: "#4A148C", text: "#F3E5F5" },
      { bg: "#311B92", text: "#EDE7F6" },
      { bg: "#B71C1C", text: "#FFEBEE" },
      { bg: "#3E2723", text: "#EFEBE9" },
      { bg: "#263238", text: "#ECEFF1" },
      { bg: "#000000", text: "#E0E0E0" },
    ];

    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          const currentIndex =
            note.colorIndex !== undefined ? note.colorIndex : 0;
          const nextIndex = (currentIndex + 1) % COLOR_ARRAY.length;
          return {
            ...note,
            colorIndex: nextIndex,
            color: COLOR_ARRAY[nextIndex].bg,
            textcolor: COLOR_ARRAY[nextIndex].text,
          };
        }
        return note;
      }),
    );
  };

  const toggleNotePin = (noteId) => {
    const noteToToggle = notes.find((note) => note.id === noteId);
    const pinnedCount = notes.filter(
      (note) => note.pinned && note.deleteStatus === "active",
    ).length;

    if (!noteToToggle.pinned && pinnedCount >= 3) {
      alert("You can only pin up to 3 notes. Unpin another note first.");
      return;
    }

    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, pinned: !note.pinned } : note,
      ),
    );
  };

  // Lists CRUD Operations
  const createList = () => {
    const COLOR_ARRAY = [
      { bg: "#e5e3e3", text: "#202124" },
      { bg: "#1A237E", text: "#E8EAF6" },
      { bg: "#1B5E20", text: "#E8F5E9" },
      { bg: "#0D47A1", text: "#E3F2FD" },
      { bg: "#4A148C", text: "#F3E5F5" },
      { bg: "#311B92", text: "#EDE7F6" },
      { bg: "#B71C1C", text: "#FFEBEE" },
      { bg: "#3E2723", text: "#EFEBE9" },
      { bg: "#263238", text: "#ECEFF1" },
      { bg: "#000000", text: "#E0E0E0" },
    ];

    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const time = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const newList = {
      title: "Untitled List",
      tasks: [],
      time: time,
      date: dateStr,
      colorIndex: 0,
      color: COLOR_ARRAY[0].bg,
      textcolor: COLOR_ARRAY[0].text,
      id: Date.now(),
      pinned: false,
      deleteStatus: "active",
      status: "unarchived",
    };

    setLists((prev) => [...prev, newList]);
  };

  const updateList = (listId, updates) => {
    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, ...updates } : list)),
    );
  };

  const deleteList = (listId) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, deleteStatus: "deleted" } : list,
      ),
    );
  };

  const archiveList = (listId) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              status: list.status === "archived" ? "unarchived" : "archived",
            }
          : list,
      ),
    );
  };

  const restoreList = (listId) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, deleteStatus: "active" } : list,
      ),
    );
  };

  const permanentDeleteList = (listId) => {
    setLists((prev) => prev.filter((list) => list.id !== listId));
  };

  const changeListColor = (listId) => {
    const COLOR_ARRAY = [
      { bg: "#e5e3e3", text: "#202124" },
      { bg: "#1A237E", text: "#E8EAF6" },
      { bg: "#1B5E20", text: "#E8F5E9" },
      { bg: "#0D47A1", text: "#E3F2FD" },
      { bg: "#4A148C", text: "#F3E5F5" },
      { bg: "#311B92", text: "#EDE7F6" },
      { bg: "#B71C1C", text: "#FFEBEE" },
      { bg: "#3E2723", text: "#EFEBE9" },
      { bg: "#263238", text: "#ECEFF1" },
      { bg: "#000000", text: "#E0E0E0" },
    ];

    setLists((prev) =>
      prev.map((list) => {
        if (list.id === listId) {
          const currentIndex =
            list.colorIndex !== undefined ? list.colorIndex : 0;
          const nextIndex = (currentIndex + 1) % COLOR_ARRAY.length;
          return {
            ...list,
            colorIndex: nextIndex,
            color: COLOR_ARRAY[nextIndex].bg,
            textcolor: COLOR_ARRAY[nextIndex].text,
          };
        }
        return list;
      }),
    );
  };

  const toggleListPin = (listId) => {
    const listToToggle = lists.find((list) => list.id === listId);
    const pinnedCount = lists.filter(
      (list) => list.pinned && list.deleteStatus === "active",
    ).length;

    if (!listToToggle.pinned && pinnedCount >= 3) {
      alert("You can only pin up to 3 lists. Unpin another list first.");
      return;
    }

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, pinned: !list.pinned } : list,
      ),
    );
  };

  const addTaskToList = (listId, taskText) => {
    if (!taskText.trim()) return;

    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
      completed: false,
    };

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, tasks: [...list.tasks, newTask] }
          : list,
      ),
    );
  };

  const toggleTaskCompletion = (listId, taskId) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            tasks: list.tasks.map((task) =>
              task.id === taskId
                ? { ...task, completed: !task.completed }
                : task,
            ),
          };
        }
        return list;
      }),
    );
  };

  const deleteTask = (listId, taskId) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            tasks: list.tasks.filter((task) => task.id !== taskId),
          };
        }
        return list;
      }),
    );
  };

  // Calendar CRUD Operations
  const addEvent = (eventData) => {
    const newEvent = {
      id: Date.now(),
      ...eventData,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (eventId, eventData) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, ...eventData } : event,
      ),
    );
  };

  const deleteEvent = (eventId) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  const addMood = (moodData) => {
    setMoods((prev) => [...prev, moodData]);
  };

  const updateMood = (moodId, moodData) => {
    setMoods((prev) =>
      prev.map((mood) =>
        mood.id === moodId ? { ...mood, ...moodData } : mood,
      ),
    );
  };

  // Mindmap CRUD Operations
  const createMindmap = () => {
    const NODE_COLORS = [
      { bg: "#1A237E", text: "#FFFFFF" },
      { bg: "#0D47A1", text: "#FFFFFF" },
      { bg: "#1B5E20", text: "#FFFFFF" },
      { bg: "#4A148C", text: "#FFFFFF" },
      { bg: "#B71C1C", text: "#FFFFFF" },
      { bg: "#E65100", text: "#FFFFFF" },
      { bg: "#004D40", text: "#FFFFFF" },
      { bg: "#3E2723", text: "#E0E0E0" },
      { bg: "#263238", text: "#FFFFFF" },
      { bg: "#7B1FA2", text: "#FFFFFF" },
      { bg: "#00695C", text: "#FFFFFF" },
      { bg: "#F9A825", text: "#000033" },
      { bg: "#AB47BC", text: "#FFFFFF" },
      { bg: "#26A69A", text: "#FFFFFF" },
      { bg: "#5C6BC0", text: "#FFFFFF" },
      { bg: "#EF5350", text: "#FFFFFF" },
    ];

    const newMindmap = {
      id: Date.now().toString(),
      nodes: [
        {
          id: "root",
          text: "Main Topic",
          parentId: null,
          children: [],
          color: NODE_COLORS[0].bg,
          textColor: NODE_COLORS[0].text,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleteStatus: "active",
      status: "unarchived",
    };

    setMindmaps((prev) => [...prev, newMindmap]);
    setActiveMindmap(newMindmap);
    setMindmapMode("editing");
  };

  const updateMindmap = (mapId, updates) => {
    setMindmaps((prev) =>
      prev.map((map) =>
        map.id === mapId
          ? { ...map, ...updates, updatedAt: new Date().toISOString() }
          : map,
      ),
    );

    if (activeMindmap && activeMindmap.id === mapId) {
      setActiveMindmap((prev) => ({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
    }
  };

  const deleteMindmap = (mapId) => {
    setMindmaps((prev) =>
      prev.map((map) =>
        map.id === mapId ? { ...map, deleteStatus: "deleted" } : map,
      ),
    );
    if (activeMindmap && activeMindmap.id === mapId) {
      setActiveMindmap(null);
      setMindmapMode("idle");
    }
  };

  const archiveMindmap = (mapId) => {
    setMindmaps((prev) =>
      prev.map((map) =>
        map.id === mapId
          ? {
              ...map,
              status: map.status === "archived" ? "unarchived" : "archived",
            }
          : map,
      ),
    );
  };

  const restoreMindmap = (mapId) => {
    setMindmaps((prev) =>
      prev.map((map) =>
        map.id === mapId ? { ...map, deleteStatus: "active" } : map,
      ),
    );
  };

  const permanentDeleteMindmap = (mapId) => {
    setMindmaps((prev) => prev.filter((map) => map.id !== mapId));
    if (activeMindmap && activeMindmap.id === mapId) {
      setActiveMindmap(null);
      setMindmapMode("idle");
    }
  };

  const addMindmapNode = (parentId, text) => {
    const NODE_COLORS = [
      { bg: "#1A237E", text: "#FFFFFF" },
      { bg: "#0D47A1", text: "#FFFFFF" },
      { bg: "#1B5E20", text: "#FFFFFF" },
      { bg: "#4A148C", text: "#FFFFFF" },
      { bg: "#B71C1C", text: "#FFFFFF" },
      { bg: "#E65100", text: "#FFFFFF" },
      { bg: "#004D40", text: "#FFFFFF" },
      { bg: "#3E2723", text: "#E0E0E0" },
      { bg: "#263238", text: "#FFFFFF" },
      { bg: "#7B1FA2", text: "#FFFFFF" },
      { bg: "#00695C", text: "#FFFFFF" },
      { bg: "#F9A825", text: "#000033" },
      { bg: "#AB47BC", text: "#FFFFFF" },
      { bg: "#26A69A", text: "#FFFFFF" },
      { bg: "#5C6BC0", text: "#FFFFFF" },
      { bg: "#EF5350", text: "#FFFFFF" },
    ];

    const newNode = {
      id: Math.random().toString(36).slice(2) + Date.now(),
      text: text.trim(),
      parentId,
      children: [],
      color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].bg,
      textColor:
        NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].text,
    };

    setActiveMindmap((prev) => ({
      ...prev,
      nodes: prev.nodes
        .map((n) =>
          n.id === parentId
            ? { ...n, children: [...n.children, newNode.id] }
            : n,
        )
        .concat(newNode),
    }));
  };

  const deleteMindmapNode = (nodeId, parentId) => {
    const getAllDescendants = (id, nodes) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return [];
      let descendants = [...node.children];
      node.children.forEach((childId) => {
        descendants = [...descendants, ...getAllDescendants(childId, nodes)];
      });
      return descendants;
    };

    if (!activeMindmap) return;

    const descendants = getAllDescendants(nodeId, activeMindmap.nodes);
    const nodesToDelete = [nodeId, ...descendants];

    setActiveMindmap((prev) => ({
      ...prev,
      nodes: prev.nodes
        .filter((n) => !nodesToDelete.includes(n.id))
        .map((n) =>
          n.id === parentId
            ? { ...n, children: n.children.filter((id) => id !== nodeId) }
            : n,
        ),
    }));
  };

  const updateMindmapNode = (nodeId, patch) => {
    if (!activeMindmap) return;
    setActiveMindmap((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    }));
  };

  // Navigation and UI functions
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const closeSidebar = () => {
    setIsSidebarVisible(false);
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    closeSidebar();
  };

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleLoginSuccess = async (loggedInUser) => {
    setUser(loggedInUser);
    firestoreSync.setCurrentUser(loggedInUser);
    const hasData = await loadDataFromFirestore();

    if (!hasData) {
      await loadFromAsyncStorageBackup();
      await migrateExistingDataToFirestore();
    }
  };

  const handleLogout = async () => {
    await syncToFirestore();
    setUser(null);
    firestoreSync.setCurrentUser(null);
    clearLocalData();
  };

  const renderScreen = () => {
    if (!user) {
      return (
        <Login onLoginSuccess={handleLoginSuccess} isDarkTheme={isDarkTheme} />
      );
    }

    if (isSyncing && notes.length === 0 && lists.length === 0) {
      return (
        <View
          style={[styles.loadingContainer, isDarkTheme && styles.containerDark]}
        >
          <ActivityIndicator
            size="large"
            color={isDarkTheme ? "#FFFFFF" : "#000033"}
          />
        </View>
      );
    }

    switch (currentScreen) {
      case "Notes":
        return (
          <Notes
            notes={notes.filter(
              (n) => n.deleteStatus === "active" && n.status === "unarchived",
            )}
            setNotes={setNotes}
            notesSearchTerm={notesSearchTerm}
            setNotesSearchTerm={setNotesSearchTerm}
            notesShowSearch={notesShowSearch}
            setNotesShowSearch={setNotesShowSearch}
            onEditingPostColorChange={setEditingPostColor}
            onCloseSidebar={closeSidebar}
            isDarkTheme={isDarkTheme}
            createNote={createNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            changeNoteColor={changeNoteColor}
            toggleNotePin={toggleNotePin}
            archiveNote={archiveNote}
            updateFontSize={updateFontSize}
          />
        );
      case "Lists":
        return (
          <List
            lists={lists.filter(
              (l) => l.deleteStatus === "active" && l.status === "unarchived",
            )}
            setLists={setLists}
            listsSearchTerm={listsSearchTerm}
            setListsSearchTerm={setListsSearchTerm}
            listsShowSearch={listsShowSearch}
            setListsShowSearch={setListsShowSearch}
            onEditingPostColorChange={setEditingPostColor}
            onCloseSidebar={closeSidebar}
            isDarkTheme={isDarkTheme}
            createList={createList}
            updateList={updateList}
            deleteList={deleteList}
            changeListColor={changeListColor}
            toggleListPin={toggleListPin}
            addTaskToList={addTaskToList}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
            archiveList={archiveList}
          />
        );
      case "Calendar":
        return (
          <Calendar
            events={events}
            setEvents={setEvents}
            moods={moods}
            setMoods={setMoods}
            dateColors={dateColors}
            setDateColors={setDateColors}
            calendarCurrentView={calendarCurrentView}
            setCalendarCurrentView={setCalendarCurrentView}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
            yearViewYear={yearViewYear}
            setYearViewYear={setYearViewYear}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            eventViewerActive={eventViewerActive}
            setEventViewerActive={setEventViewerActive}
            showEventEditor={showEventEditor}
            setShowEventEditor={setShowEventEditor}
            editingEvent={editingEvent}
            setEditingEvent={setEditingEvent}
            deleteWarningActive={deleteWarningActive}
            setDeleteWarningActive={setDeleteWarningActive}
            eventToDelete={eventToDelete}
            setEventToDelete={setEventToDelete}
            viewerBg={viewerBg}
            setViewerBg={setViewerBg}
            onCloseSidebar={closeSidebar}
            onViewChange={setCalendarView}
            isDarkTheme={isDarkTheme}
            addEvent={addEvent}
            updateEvent={updateEvent}
            deleteEvent={deleteEvent}
            addMood={addMood}
            updateMood={updateMood}
            scheduleReminder={scheduleReminder}
            getRemindersForDate={getRemindersForDate}
            cancelRemindersForDate={cancelRemindersForDate}
          />
        );
      case "Mindmap":
        return (
          <Mindmap
            mindmaps={mindmaps.filter(
              (m) => m.deleteStatus === "active" && m.status === "unarchived",
            )}
            setMindmaps={setMindmaps}
            activeMindmap={activeMindmap}
            setActiveMindmap={setActiveMindmap}
            mindmapMode={mindmapMode}
            setMindmapMode={setMindmapMode}
            mindmapInput={mindmapInput}
            setMindmapInput={setMindmapInput}
            mindmapScale={mindmapScale}
            setMindmapScale={setMindmapScale}
            openColorNode={openColorNode}
            setOpenColorNode={setOpenColorNode}
            isMindmapAuthenticated={isMindmapAuthenticated}
            setIsMindmapAuthenticated={setIsMindmapAuthenticated}
            onCloseSidebar={closeSidebar}
            isDarkTheme={isDarkTheme}
            createMindmap={createMindmap}
            updateMindmap={updateMindmap}
            deleteMindmap={deleteMindmap}
            addMindmapNode={addMindmapNode}
            deleteMindmapNode={deleteMindmapNode}
            updateMindmapNode={updateMindmapNode}
            archiveMindmap={archiveMindmap}
          />
        );
      case "Archive":
        return (
          <Archive
            notes={notes.filter((n) => n.status === "archived")}
            lists={lists.filter((l) => l.status === "archived")}
            mindmaps={mindmaps.filter((m) => m.status === "archived")}
            onRestoreNote={archiveNote}
            onRestoreList={archiveList}
            onRestoreMindmap={archiveMindmap}
            onPermanentDeleteNote={permanentDeleteNote}
            onPermanentDeleteList={permanentDeleteList}
            onPermanentDeleteMindmap={permanentDeleteMindmap}
            isDarkTheme={isDarkTheme}
            onCloseSidebar={closeSidebar}
          />
        );
      case "Deleted":
        return (
          <Deleted
            notes={notes.filter((n) => n.deleteStatus === "deleted")}
            lists={lists.filter((l) => l.deleteStatus === "deleted")}
            mindmaps={mindmaps.filter((m) => m.deleteStatus === "deleted")}
            onRestoreNote={restoreNote}
            onRestoreList={restoreList}
            onRestoreMindmap={restoreMindmap}
            onPermanentDeleteNote={permanentDeleteNote}
            onPermanentDeleteList={permanentDeleteList}
            onPermanentDeleteMindmap={permanentDeleteMindmap}
            isDarkTheme={isDarkTheme}
            onCloseSidebar={closeSidebar}
          />
        );
      case "Settings":
        return (
          <Settings
            onCloseSidebar={closeSidebar}
            isDarkTheme={isDarkTheme}
            onToggleTheme={toggleTheme}
            user={user}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <Notes
            notes={notes.filter(
              (n) => n.deleteStatus === "active" && n.status === "unarchived",
            )}
            setNotes={setNotes}
            notesSearchTerm={notesSearchTerm}
            setNotesSearchTerm={setNotesSearchTerm}
            notesShowSearch={notesShowSearch}
            setNotesShowSearch={setNotesShowSearch}
            onEditingPostColorChange={setEditingPostColor}
            onCloseSidebar={closeSidebar}
            isDarkTheme={isDarkTheme}
            createNote={createNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            changeNoteColor={changeNoteColor}
            toggleNotePin={toggleNotePin}
            archiveNote={archiveNote}
            updateFontSize={updateFontSize}
          />
        );
    }
  };

  const isHamburgerDisabled = () => {
    if (editingPostColor !== null) return true;
    if (currentScreen === "Calendar" && calendarView === "year") return true;
    return false;
  };

  if (isLoading) {
    return (
      <View
        style={[styles.loadingContainer, isDarkTheme && styles.containerDark]}
      >
        <ActivityIndicator
          size="large"
          color={isDarkTheme ? "#FFFFFF" : "#000033"}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkTheme && styles.containerDark,
        {
          backgroundColor: isDarkTheme ? "#1a1a1a" : "#f5f5f5",
        },
      ]}
    >
      {user && (
        <Navbar
          onMenuPress={toggleSidebar}
          isSidebarVisible={isSidebarVisible}
          closeSidebar={closeSidebar}
          currentScreen={currentScreen}
          editingPostColor={editingPostColor}
          isHamburgerDisabled={isHamburgerDisabled()}
          isDarkTheme={isDarkTheme}
        />
      )}
      {user && (
        <Sidebar
          isVisible={isSidebarVisible}
          onClose={closeSidebar}
          onNavigate={navigateTo}
          currentScreen={currentScreen}
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          user={user}
        />
      )}
      <View style={styles.screenContainer}>{renderScreen()}</View>
    </SafeAreaView>
  );
}

// Main App with Navigation Container
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainApp} />
        <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
        <Stack.Screen name="ListEditor" component={ListEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#1a1a1a",
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
