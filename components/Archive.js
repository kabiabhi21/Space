// components/Archive.js
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = (screenWidth - 60) / 2;

export default function Archive({
  notes,
  lists,
  mindmaps,
  onRestoreNote,
  onRestoreList,
  onRestoreMindmap,
  onPermanentDeleteNote,
  onPermanentDeleteList,
  onPermanentDeleteMindmap,
  isDarkTheme = false,
  onCloseSidebar,
}) {
  const [activeTab, setActiveTab] = useState("notes");

  const getBackgroundColor = () => {
    return isDarkTheme ? "#1a1a1a" : "#f5f5f5";
  };

  const getTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getCardBorderColor = (color) => {
    return isDarkTheme ? "#3a3a3a" : "#e0e0e0";
  };

  const handleRestoreNote = (note) => {
    Alert.alert("Restore Note", "Are you sure you want to restore this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => onRestoreNote(note.id),
      },
    ]);
  };

  const handlePermanentDeleteNote = (note) => {
    Alert.alert(
      "Delete Permanently",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onPermanentDeleteNote(note.id),
        },
      ],
    );
  };

  const handleRestoreList = (list) => {
    Alert.alert("Restore List", "Are you sure you want to restore this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => onRestoreList(list.id),
      },
    ]);
  };

  const handlePermanentDeleteList = (list) => {
    Alert.alert(
      "Delete Permanently",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onPermanentDeleteList(list.id),
        },
      ],
    );
  };

  const handleRestoreMindmap = (mindmap) => {
    Alert.alert(
      "Restore Mindmap",
      "Are you sure you want to restore this mindmap?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: () => onRestoreMindmap(mindmap.id),
        },
      ],
    );
  };

  const handlePermanentDeleteMindmap = (mindmap) => {
    Alert.alert(
      "Delete Permanently",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onPermanentDeleteMindmap(mindmap.id),
        },
      ],
    );
  };

  const renderNoteCard = (note) => {
    const truncatedText =
      note.sentence.length > 100
        ? note.sentence.substring(0, 100) + "..."
        : note.sentence;

    return (
      <TouchableOpacity
        key={note.id}
        style={[
          styles.card,
          {
            backgroundColor: note.color,
            borderColor: getCardBorderColor(note.color),
          },
        ]}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: note.textcolor }]}
            numberOfLines={2}
          >
            {note.title || "Untitled"}
          </Text>
          <Text
            style={[styles.cardText, { color: note.textcolor }]}
            numberOfLines={3}
          >
            {truncatedText || "Empty note"}
          </Text>
          <Text style={[styles.cardDate, { color: note.textcolor }]}>
            Archived on: {note.date}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRestoreNote(note)}
            >
              <Feather name="refresh-cw" size={18} color={note.textcolor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePermanentDeleteNote(note)}
            >
              <Feather name="trash-2" size={18} color={note.textcolor} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListCard = (list) => {
    const taskCount = list.tasks?.length || 0;
    const completedCount = list.tasks?.filter((t) => t.completed).length || 0;

    return (
      <TouchableOpacity
        key={list.id}
        style={[
          styles.card,
          {
            backgroundColor: list.color,
            borderColor: getCardBorderColor(list.color),
          },
        ]}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: list.textcolor }]}
            numberOfLines={2}
          >
            {list.title || "Untitled List"}
          </Text>
          <Text style={[styles.cardText, { color: list.textcolor }]}>
            {completedCount}/{taskCount} tasks completed
          </Text>
          <Text style={[styles.cardDate, { color: list.textcolor }]}>
            Archived on: {list.date}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRestoreList(list)}
            >
              <Feather name="refresh-cw" size={18} color={list.textcolor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePermanentDeleteList(list)}
            >
              <Feather name="trash-2" size={18} color={list.textcolor} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMindmapCard = (mindmap) => {
    const rootNode = mindmap.nodes?.find((n) => n.parentId === null);

    return (
      <TouchableOpacity
        key={mindmap.id}
        style={[
          styles.card,
          {
            backgroundColor: rootNode?.color || "#1A237E",
            borderColor: getCardBorderColor(rootNode?.color || "#1A237E"),
          },
        ]}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.cardTitle,
              { color: rootNode?.textColor || "#FFFFFF" },
            ]}
            numberOfLines={2}
          >
            {rootNode?.text || "Untitled Mindmap"}
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: rootNode?.textColor || "#FFFFFF" },
            ]}
          >
            {mindmap.nodes?.length || 0} nodes
          </Text>
          <Text
            style={[
              styles.cardDate,
              { color: rootNode?.textColor || "#FFFFFF" },
            ]}
          >
            Archived on: {new Date(mindmap.updatedAt).toLocaleDateString()}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRestoreMindmap(mindmap)}
            >
              <Feather
                name="refresh-cw"
                size={18}
                color={rootNode?.textColor || "#FFFFFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePermanentDeleteMindmap(mindmap)}
            >
              <Feather
                name="trash-2"
                size={18}
                color={rootNode?.textColor || "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotesTab = () => {
    if (notes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather
            name="archive"
            size={48}
            color={isDarkTheme ? "#6b7280" : "#999"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            No archived notes
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {notes.map((note) => renderNoteCard(note))}
      </View>
    );
  };

  const renderListsTab = () => {
    if (lists.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather
            name="archive"
            size={48}
            color={isDarkTheme ? "#6b7280" : "#999"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            No archived lists
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {lists.map((list) => renderListCard(list))}
      </View>
    );
  };

  const renderMindmapsTab = () => {
    if (mindmaps.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather
            name="archive"
            size={48}
            color={isDarkTheme ? "#6b7280" : "#999"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            No archived mindmaps
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {mindmaps.map((mindmap) => renderMindmapCard(mindmap))}
      </View>
    );
  };

  const getActiveTabColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getInactiveTabColor = () => {
    return isDarkTheme ? "#6b7280" : "#999";
  };

  const getTabBorderColor = () => {
    return isDarkTheme ? "#3a3a3a" : "#e0e0e0";
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={getBackgroundColor()}
        translucent={false}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: getTextColor() }]}>Archive</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "notes" && styles.activeTab,
            {
              borderBottomColor:
                activeTab === "notes"
                  ? getActiveTabColor()
                  : getTabBorderColor(),
            },
          ]}
          onPress={() => setActiveTab("notes")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "notes"
                    ? getActiveTabColor()
                    : getInactiveTabColor(),
              },
            ]}
          >
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "lists" && styles.activeTab,
            {
              borderBottomColor:
                activeTab === "lists"
                  ? getActiveTabColor()
                  : getTabBorderColor(),
            },
          ]}
          onPress={() => setActiveTab("lists")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "lists"
                    ? getActiveTabColor()
                    : getInactiveTabColor(),
              },
            ]}
          >
            Lists ({lists.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "mindmaps" && styles.activeTab,
            {
              borderBottomColor:
                activeTab === "mindmaps"
                  ? getActiveTabColor()
                  : getTabBorderColor(),
            },
          ]}
          onPress={() => setActiveTab("mindmaps")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "mindmaps"
                    ? getActiveTabColor()
                    : getInactiveTabColor(),
              },
            ]}
          >
            Mindmaps ({mindmaps.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "notes" && renderNotesTab()}
        {activeTab === "lists" && renderListsTab()}
        {activeTab === "mindmaps" && renderMindmapsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    height: 180, // Fixed height - adjust this value as needed
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between", // This distributes content evenly
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
    flex: 1, // Allows text to take available space
  },
  cardDate: {
    fontSize: 10,
    marginBottom: 12,
    opacity: 0.7,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});
