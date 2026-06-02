// components/Settings.js
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
  Image,
} from "react-native";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Settings({
  onCloseSidebar,
  isDarkTheme,
  onToggleTheme,
  user,
  onLogout,
  // Optional: Add more settings as needed
  // onClearAllData,
  // onExportData,
  // onImportData,
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          if (onLogout) {
            onLogout();
          }
        },
      },
    ]);
  };

  const getBackgroundColor = () => {
    return isDarkTheme ? "#1a1a1a" : "whitesmoke";
  };

  const getCardBackground = () => {
    return isDarkTheme ? "#2a2a2a" : "#ffffff";
  };

  const getTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getSubTextColor = () => {
    return isDarkTheme ? "#9ca3af" : "#666666";
  };

  const getBorderColor = () => {
    return isDarkTheme ? "#3a3a3a" : "#e0e0e0";
  };

  const getSectionTitleColor = () => {
    return isDarkTheme ? "#9ca3af" : "#000033";
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: getBackgroundColor() }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={getBackgroundColor()}
        translucent={false}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: getTextColor() }]}>
          Settings
        </Text>
      </View>

      {/* User Info Section */}
      {user && (
        <View style={[styles.section, { borderBottomColor: getBorderColor() }]}>
          <Text
            style={[styles.sectionTitle, { color: getSectionTitleColor() }]}
          >
            Account
          </Text>
          <View style={[styles.card, { backgroundColor: getCardBackground() }]}>
            <View style={styles.userInfoRow}>
              {/* <FontAwesome6
                name="user-circle"
                iconStyle="solid"
                size={40}
                color={getTextColor()}
              /> */}
              {user.photoURL && (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.userAvatar}
                />
              )}
              <View style={styles.userInfoText}>
                <Text style={[styles.userEmail, { color: getTextColor() }]}>
                  {user.email || user.displayName || "User"}
                </Text>
                <Text style={[styles.userId, { color: getSubTextColor() }]}>
                  User ID: {user.uid?.slice(0, 8)}...
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Appearance Section */}
      <View style={[styles.section, { borderBottomColor: getBorderColor() }]}>
        <Text style={[styles.sectionTitle, { color: getSectionTitleColor() }]}>
          Appearance
        </Text>
        <View style={[styles.card, { backgroundColor: getCardBackground() }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name={isDarkTheme ? "moon" : "sun"}
                iconStyle="solid"
                size={22}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                {isDarkTheme ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <Switch
              value={isDarkTheme}
              onValueChange={onToggleTheme}
              trackColor={{ false: "#767577", true: "#4CAF50" }}
              thumbColor={isDarkTheme ? "#f5f5f5" : "#f4f3f4"}
            />
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={[styles.section, { borderBottomColor: getBorderColor() }]}>
        <Text style={[styles.sectionTitle, { color: getSectionTitleColor() }]}>
          Preferences
        </Text>
        <View style={[styles.card, { backgroundColor: getCardBackground() }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="bell"
                iconStyle="solid"
                size={20}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                Notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#4CAF50" }}
              thumbColor={notificationsEnabled ? "#f5f5f5" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="floppy-disk"
                iconStyle="solid"
                size={20}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                Auto-save
              </Text>
            </View>
            <Switch
              value={autoSaveEnabled}
              onValueChange={setAutoSaveEnabled}
              trackColor={{ false: "#767577", true: "#4CAF50" }}
              thumbColor={autoSaveEnabled ? "#f5f5f5" : "#f4f3f4"}
            />
          </View>
        </View>
      </View>

      {/* Data Management Section */}
      {/* <View style={[styles.section, { borderBottomColor: getBorderColor() }]}>
        <Text style={[styles.sectionTitle, { color: getSectionTitleColor() }]}>
          Data Management
        </Text>
        <View style={[styles.card, { backgroundColor: getCardBackground() }]}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="download"
                iconStyle="solid"
                size={20}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                Export Data
              </Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              iconStyle="solid"
              size={14}
              color={getSubTextColor()}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="upload"
                iconStyle="solid"
                size={20}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                Import Data
              </Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              iconStyle="solid"
              size={14}
              color={getSubTextColor()}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.dangerRow]}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                "Clear All Data",
                "Are you sure? This action cannot be undone!",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive" },
                ],
              );
            }}
          >
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="trash-can"
                iconStyle="solid"
                size={20}
                color="#F44336"
              />
              <Text style={[styles.settingLabel, { color: "#F44336" }]}>
                Clear All Data
              </Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              iconStyle="solid"
              size={14}
              color={getSubTextColor()}
            />
          </TouchableOpacity>
        </View>
      </View> */}

      {/* About Section */}
      {/* <View style={[styles.section, { borderBottomColor: getBorderColor() }]}>
        <Text style={[styles.sectionTitle, { color: getSectionTitleColor() }]}>
          About
        </Text>
        <View style={[styles.card, { backgroundColor: getCardBackground() }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="info-circle"
                iconStyle="solid"
                size={20}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                Version
              </Text>
            </View>
            <Text style={[styles.versionText, { color: getSubTextColor() }]}>
              1.0.0
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <FontAwesome6
                name="code-branch"
                iconStyle="solid"
                size={20}
                color={getTextColor()}
              />
              <Text style={[styles.settingLabel, { color: getTextColor() }]}>
                Build
              </Text>
            </View>
            <Text style={[styles.versionText, { color: getSubTextColor() }]}>
              #001
            </Text>
          </View>
        </View>
      </View> */}

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: getBorderColor() }]}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <FontAwesome6
          name="arrow-right-from-bracket"
          iconStyle="solid"
          size={20}
          color="#F44336"
        />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  dangerRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  userInfoText: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
  },
  versionText: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F44336",
  },
  userAvatar: {
    width: 25,
    height: 25,
    borderRadius: 20,
  },
});
