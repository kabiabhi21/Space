// components/Login.js
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";
import { signInWithGoogle } from "../services/firebase";
import { FontAwesome6 } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Login({ onLoginSuccess, isDarkTheme = false }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      Alert.alert("Login Failed", result.error || "Something went wrong");
    }
  };

  const getBackgroundColor = () => {
    return isDarkTheme ? "#1a1a1a" : "#f5f5f5";
  };

  const getTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getCardBackground = () => {
    return isDarkTheme ? "#1a1a1a" : "whitesmoke";
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={getBackgroundColor()}
      />

      {/* <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <FontAwesome6 name="rocket" size={60} color="#4285F4" />
        </View>
        <Text style={[styles.appName, { color: getTextColor() }]}>Space.</Text>
        <Text
          style={[styles.tagline, { color: isDarkTheme ? "#9ca3af" : "#666" }]}
        >
          Organize your thoughts, tasks, and ideas
        </Text>
      </View> */}

      <View style={styles.logoWrappr}>
        <Text
          style={[styles.logoTxt, { color: isDarkTheme ? "white" : "#000033" }]}
        >
          Space.
        </Text>
        <View
          style={[
            styles.brandContainer,
            { color: isDarkTheme ? "white" : "#000033" },
          ]}
        >
          <FontAwesome6
            name="flask"
            size={14}
            color={isDarkTheme ? "white" : "#000033"}
          />
          <Text
            style={[
              styles.brandName,
              { color: isDarkTheme ? "white" : "#000033" },
            ]}
          >
            iINTUIT Labs.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: getCardBackground() }]}>
        {/* <Text style={[styles.welcomeText, { color: getTextColor() }]}>
          Welcome to Space
        </Text> */}
        {/* <Text
          style={[styles.subtitle, { color: isDarkTheme ? "#9ca3af" : "#666" }]}
        >
          Sign in to sync your data across all devices
        </Text> */}

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome6
                name="google"
                size={20}
                color="#fff"
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(66, 133, 244, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    width: width - 48,
    padding: 24,

    alignItems: "center",
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#000033",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoWrappr: {
    marginBottom: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 25,
  },
  logoTxt: {
    fontSize: 50,
    fontWeight: "bold",
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
