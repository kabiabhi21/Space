// services/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAv-JSAb23AbGn16bnz4oJMiZRMy9uoU7s",
  authDomain: "spaceapp-9202a.firebaseapp.com",
  projectId: "spaceapp-9202a",
  storageBucket: "spaceapp-9202a.firebasestorage.app",
  messagingSenderId: "640378667893",
  appId: "1:640378667893:android:c23932d86ae598b91a093c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "640378667893-h982si66dp9v2fmeu6b0dquktg7hsf6a.apps.googleusercontent.com",
  offlineAccess: true,
});

export const signInWithGoogle = async () => {
  try {
    // Check Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in and get user info
    const userInfo = await GoogleSignin.signIn();

    console.log("User Info:", userInfo);

    // Get the ID token - from the data object
    const idToken = userInfo.data?.idToken || userInfo.idToken;

    if (!idToken) {
      console.error("No ID token found");
      Alert.alert("Sign In Error", "Could not get ID token. Please try again.");
      return { success: false, error: "No ID token found" };
    }

    // Create credential and sign in to Firebase
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);

    console.log("Firebase sign in successful:", userCredential.user.email);

    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Google Sign-In Error:", error);

    if (error.code === "SIGN_IN_CANCELLED") {
      Alert.alert("Sign In Cancelled", "You cancelled the sign in process.");
    } else {
      Alert.alert("Sign In Error", error.message);
    }

    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await GoogleSignin.signOut();
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign Out Error:", error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};

// Export db and Firestore functions
export {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
};
