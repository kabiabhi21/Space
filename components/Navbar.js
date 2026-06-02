// components/Navbar.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";

const Navbar = ({
  onMenuPress,
  isSidebarVisible,
  closeSidebar,
  currentScreen,
  editingPostColor,
  isHamburgerDisabled = false,
  isDarkTheme = false,
}) => {
  const shouldHideHamburger = editingPostColor !== null || isHamburgerDisabled;

  const getBorderBottomColor = () => {
    if (editingPostColor) {
      const colorMap = {
        "#e5e3e3": "#D0D0D0",
        "#1A237E": "#2C3E7A",
        "#1B5E20": "#2E7D32",
        "#0D47A1": "#1565C0",
        "#4A148C": "#6A1B9A",
        "#311B92": "#4527A0",
        "#B71C1C": "#C62828",
        "#3E2723": "#4E342E",
        "#263238": "#37474F",
        "#000000": "#1a1a1a",
      };
      return colorMap[editingPostColor] || editingPostColor;
    }
    return isDarkTheme ? "#2a2a2a" : "#e0e0e0";
  };

  const getNavbarBackground = () => {
    if (editingPostColor) {
      return editingPostColor;
    }
    return isDarkTheme ? "#1a1a1a" : "transparent";
  };

  const getIconColor = () => {
    if (editingPostColor) {
      const isDark =
        editingPostColor === "#1A237E" ||
        editingPostColor === "#1B5E20" ||
        editingPostColor === "#0D47A1" ||
        editingPostColor === "#4A148C" ||
        editingPostColor === "#311B92" ||
        editingPostColor === "#B71C1C" ||
        editingPostColor === "#3E2723" ||
        editingPostColor === "#263238" ||
        editingPostColor === "#000000";
      return isDark ? "#FFFFFF" : "#000000";
    }
    return isDarkTheme ? "#FFFFFF" : "#000000";
  };

  const getLogoColor = () => {
    if (editingPostColor) {
      const isDark =
        editingPostColor === "#1A237E" ||
        editingPostColor === "#1B5E20" ||
        editingPostColor === "#0D47A1" ||
        editingPostColor === "#4A148C" ||
        editingPostColor === "#311B92" ||
        editingPostColor === "#B71C1C" ||
        editingPostColor === "#3E2723" ||
        editingPostColor === "#263238" ||
        editingPostColor === "#000000";
      return isDark ? "#FFFFFF" : "#000033";
    }
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getNavbarBackground(),
          borderBottomColor: getBorderBottomColor(),
        },
      ]}
    >
      <View style={styles.navbar}>
        {!shouldHideHamburger && (
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            delayPressIn={0}
            onPress={isSidebarVisible ? closeSidebar : onMenuPress}
          >
            <FontAwesome6
              name="bars"
              iconStyle="solid"
              size={22}
              color={getIconColor()}
              style={styles.navicon}
            />
          </TouchableOpacity>
        )}
        {shouldHideHamburger && <View style={styles.hiddenSpacer} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 5,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  navicon: {
    marginTop: 20,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 80,
    minWidth: 60,
  },
  hiddenSpacer: {
    width: 46,
    height: 30,
  },
});

export default Navbar;
