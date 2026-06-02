// components/Sidebar.js
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Image,
} from "react-native";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { signOut } from "../services/firebase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.7;

const Sidebar = ({
  isVisible,
  onClose,
  onNavigate,
  currentScreen,
  isDarkTheme = false,
  onToggleTheme,
  onLogout,
  user,
}) => {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, overlayOpacity]);

  const menuItems = [
    { name: "Notes", icon: "note-sticky", label: "Notes" },
    { name: "Drawing", icon: "palette", label: "Drawing" },
    { name: "Lists", icon: "list-check", label: "Lists" },
    { name: "Calendar", icon: "calendar-days", label: "Calendar" },
    { name: "Mindmap", icon: "brain", label: "Mindmap" },
    {
      name: "Quote of the day",
      icon: "quote-right",
      label: "Quote of the day",
    },
    { name: "Archive", icon: "box-archive", label: "Archive" },
    { name: "Deleted", icon: "trash-can", label: "Bin" },
    { name: "Settings", icon: "gear", label: "Settings" },
  ];

  const getItemColor = (isActive = false) => {
    if (isDarkTheme) {
      return isActive ? "white" : "white";
    }
    return isActive ? "#000033" : "#000033";
  };

  const getIconBackColor = () => {
    return isDarkTheme ? "#404040" : "#e2e1e1";
  };

  const getTextColor = (isActive = false) => {
    if (isDarkTheme) {
      return isActive ? "white" : "white";
    }
    return isActive ? "#000033" : "#000033";
  };

  const getActiveBackgroundColor = () => {
    return isDarkTheme ? "#2a2a2a" : "#ecebeb";
  };

  const getSidebarBackground = () => {
    return isDarkTheme ? "#1a1a1a" : "whitesmoke";
  };

  const getBorderColor = () => {
    return isDarkTheme ? "#2a2a2a" : "#e0e0e0";
  };

  if (!isVisible && slideAnim._value === -SIDEBAR_WIDTH) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: overlayOpacity,
          backgroundColor: "transparent",
        },
      ]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: slideAnim }],
            backgroundColor: getSidebarBackground(),
            // borderRightColor: getBorderColor(),
            // borderTopColor: getBorderColor(),
          },
        ]}
      >
        <View style={styles.sidebarContent}>
          <View style={styles.navItems}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  currentScreen === item.name && {
                    backgroundColor: getActiveBackgroundColor(),
                  },
                ]}
                onPress={() => {
                  console.log(`${item.label} pressed`);
                  onNavigate(item.name);
                }}
              >
                <View style={styles.navItemCont}>
                  <View style={{ width: 30, alignItems: "center" }}>
                    <View
                      style={[
                        styles.iconHolder,
                        // { backgroundColor: getIconBackColor() },
                      ]}
                    >
                      <FontAwesome6
                        name={item.icon}
                        iconStyle="solid"
                        size={18}
                        color={getItemColor(currentScreen === item.name)}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.navItemText,
                      { color: getTextColor(currentScreen === item.name) },
                      currentScreen === item.name && styles.activeNavItemText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.wrapper}>
          <View style={styles.brandContainer}>
            <FontAwesome
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
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 110,
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  brandName: {
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 65,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000033",
  },

  navItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  navItemText: {
    fontSize: 18,
  },
  activeNavItemText: {
    fontWeight: "600",
  },
  navItemCont: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 15,
  },
  themeToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  themeToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingVertical: 8,
  },
  themeToggleText: {
    fontSize: 18,
  },
  userInfo: {
    display: "flex",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginHorizontal: 20,
  },
  userEmail: {
    fontSize: 10,
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#e1dfdf",
    marginTop: 10,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: "500",
  },
  userAvatar: {
    width: 25,
    height: 25,
    borderRadius: 20,
  },
  iconHolder: {
    height: 40,
    width: 40,

    borderRadius: 50,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Sidebar;
