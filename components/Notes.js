// components/Notes.js
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  BackHandler,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const { width: screenWidth } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = (screenWidth - 40 - CARD_MARGIN) / 2;

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

export default function Notes({
  notes,
  setNotes,
  notesSearchTerm,
  setNotesSearchTerm,
  notesShowSearch,
  setNotesShowSearch,
  editingNote,
  setEditingNote,
  editingNoteText,
  setEditingNoteText,
  editingNoteTitle,
  setEditingNoteTitle,
  onEditingPostColorChange,
  onCloseSidebar,
  isDarkTheme = false,
  createNote,
  updateNote,
  deleteNote,
  changeNoteColor,
  toggleNotePin,
  archiveNote,
  updateFontSize,
}) {
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    if (onEditingPostColorChange) {
      onEditingPostColorChange(editingNote?.color || null);
    }
  }, [editingNote, onEditingPostColorChange]);

  useEffect(() => {
    const backAction = () => {
      if (editingNote !== null) {
        const hasChanges =
          editingNoteTitle !== editingNote.title ||
          editingNoteText !== editingNote.sentence;

        if (hasChanges) {
          saveCurrentEdit();
        }
        setEditingNote(null);
        setEditingNoteText("");
        setEditingNoteTitle("");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [editingNote, editingNoteText, editingNoteTitle]);

  const getBorderColor = (color) => {
    if (isDarkTheme && (color === "#e5e3e3" || color === "#f5f5f5")) {
      return "#3a3a3a";
    }
    switch (color) {
      case "#e5e3e3":
        return "#D0D0D0";
      case "#1A237E":
        return "#2C3E7A";
      case "#1B5E20":
        return "#2E7D32";
      case "#0D47A1":
        return "#1565C0";
      case "#4A148C":
        return "#6A1B9A";
      case "#311B92":
        return "#4527A0";
      case "#B71C1C":
        return "#C62828";
      case "#3E2723":
        return "#4E342E";
      case "#263238":
        return "#37474F";
      case "#000000":
        return "#424242";
      default:
        return "#424242";
    }
  };

  const isDarkBackground = (color) => {
    const darkColors = ["#000033", "#301934", "#9C27B0"];
    return darkColors.includes(color);
  };

  const saveCurrentEdit = () => {
    if (editingNote !== null) {
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

      updateNote(editingNote.id, {
        title: editingNoteTitle,
        sentence: editingNoteText,
        time: time,
        date: dateStr,
        font: editingNote.font,
      });
    }
  };

  const closeEditorAndSave = () => {
    const hasChanges =
      editingNoteTitle !== editingNote?.title ||
      editingNoteText !== editingNote?.sentence;

    if (hasChanges) {
      saveCurrentEdit();
    }
    setEditingNote(null);
    setEditingNoteText("");
    setEditingNoteTitle("");
  };

  const openPostEditor = (note) => {
    setEditingNote(note);
    setEditingNoteText(note.sentence);
    setEditingNoteTitle(note.title || "Untitled");
  };

  const deletePostFromEditor = () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          deleteNote(editingNote.id);
          setEditingNote(null);
          setEditingNoteText("");
          setEditingNoteTitle("");
        },
        style: "destructive",
      },
    ]);
  };

  const togglePinInEditor = () => {
    if (editingNote) {
      toggleNotePin(editingNote.id);
      setEditingNote({
        ...editingNote,
        pinned: !editingNote.pinned,
      });
    }
  };

  const changeColorInEditor = () => {
    if (!editingNote) return;
    changeNoteColor(editingNote.id);

    const currentIndex =
      editingNote.colorIndex !== undefined ? editingNote.colorIndex : 0;
    const nextIndex = (currentIndex + 1) % COLOR_ARRAY.length;
    setEditingNote({
      ...editingNote,
      colorIndex: nextIndex,
      color: COLOR_ARRAY[nextIndex].bg,
      textcolor: COLOR_ARRAY[nextIndex].text,
    });
  };

  const clearSearch = () => {
    setNotesSearchTerm("");
    setNotesShowSearch(false);
  };

  const filteredNotes =
    notesSearchTerm.trim() === ""
      ? notes
      : notes.filter(
          (note) =>
            note.sentence
              .toLowerCase()
              .includes(notesSearchTerm.toLowerCase()) ||
            note.title.toLowerCase().includes(notesSearchTerm.toLowerCase()),
        );

  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const unpinnedNotes = filteredNotes.filter((note) => !note.pinned);
  const unpinnedNotesForDisplay = [...unpinnedNotes].reverse();

  const truncateText = (text, maxLength = 1000) => {
    if (!text || typeof text !== "string" || text.length === 0) {
      return "Empty note - tap to edit";
    }
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  };

  const renderCard = (note) => {
    if (!note) return null;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: note.color,
            borderColor: getBorderColor(note.color),
          },
        ]}
        onPress={() => openPostEditor(note)}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: note.textcolor,
              },
            ]}
            numberOfLines={2}
          >
            {note.title || "Untitled"}
          </Text>
          <Text
            style={[
              styles.postText,
              {
                color: note.textcolor,
              },
            ]}
            numberOfLines={10}
            ellipsizeMode="tail"
          >
            {truncateText(note.sentence)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFlexSection = (postsArray, sectionTitle, showTitle = true) => {
    if (postsArray.length === 0) return null;

    return (
      <View>
        {showTitle && (
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkTheme ? "#9ca3af" : "#000033" },
            ]}
          >
            {sectionTitle}
          </Text>
        )}
        <View style={styles.flexContainer}>
          {postsArray.map((note) => (
            <View key={note.id} style={styles.flexItem}>
              {renderCard(note)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getBackgroundColor = () => {
    return isDarkTheme ? "#1a1a1a" : "whitesmoke";
  };

  const getTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getSearchInputStyle = () => {
    return {
      borderColor: isDarkTheme ? "#3a3a3a" : "#000033",
      backgroundColor: isDarkTheme ? "#2a2a2a" : "white",
      color: isDarkTheme ? "#FFFFFF" : "gray",
    };
  };

  const getCreateButtonStyle = () => {
    return {
      borderColor: isDarkTheme ? "#3a3a3a" : "#000033",
      backgroundColor: "transparent",
    };
  };

  const getCreateButtonTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: getBackgroundColor() }]}
    >
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={getBackgroundColor()}
        translucent={false}
      />

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: getTextColor() }]}>Notes</Text>
        </View>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => setNotesShowSearch(!notesShowSearch)}
          activeOpacity={0.7}
        >
          <Feather name="search" size={24} color={getTextColor()} />
        </TouchableOpacity>
      </View>

      {notesShowSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, getSearchInputStyle()]}
            placeholder="Search Notes..."
            placeholderTextColor={isDarkTheme ? "#6b7280" : "#999"}
            value={notesSearchTerm}
            onChangeText={setNotesSearchTerm}
            autoFocus={true}
            blurOnSubmit={true}
            returnKeyType="search"
          />
          {notesSearchTerm !== "" && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearSearchButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearSearchText, { color: getTextColor() }]}>
                ✖
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={[styles.createButton, getCreateButtonStyle()]}
          onPress={createNote}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={20} color={getCreateButtonTextColor()} />
          <Text
            style={{ margin: 0, padding: 0, color: getCreateButtonTextColor() }}
          >
            NEW NOTE
          </Text>
        </TouchableOpacity>
      </View>

      {filteredNotes.length === 0 && notesSearchTerm !== "" && (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            No notes matching "{notesSearchTerm}"
          </Text>
        </View>
      )}

      {filteredNotes.length === 0 && notesSearchTerm === "" && (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            NO NOTES YET
          </Text>
          <Text
            style={[
              styles.emptySubText,
              { color: isDarkTheme ? "#4b5563" : "#bbb" },
            ]}
          >
            Your notes will be saved automatically
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderFlexSection(pinnedNotes, "Pinned", pinnedNotes.length > 0)}
        {renderFlexSection(
          unpinnedNotesForDisplay,
          "Other Notes",
          pinnedNotes.length > 0 && unpinnedNotesForDisplay.length > 0,
        )}
        <View style={{ height: Platform.OS === "ios" ? 120 : 80 }} />
      </ScrollView>

      {editingNote !== null && (
        <View
          style={[
            styles.fullScreenEditor,
            {
              backgroundColor:
                editingNote.color || (isDarkTheme ? "#1a1a1a" : "whitesmoke"),
            },
          ]}
        >
          <StatusBar
            barStyle={
              editingNote.textcolor === "white" ||
              editingNote.color === "#1A237E" ||
              editingNote.color === "#1B5E20" ||
              editingNote.color === "#0D47A1" ||
              editingNote.color === "#4A148C" ||
              editingNote.color === "#311B92" ||
              editingNote.color === "#B71C1C" ||
              editingNote.color === "#3E2723" ||
              editingNote.color === "#263238" ||
              editingNote.color === "#000000"
                ? "light-content"
                : "dark-content"
            }
            backgroundColor={editingNote.color}
            translucent={false}
          />

          <View style={styles.editorHeader}>
            <TouchableOpacity
              onPress={closeEditorAndSave}
              style={styles.editorBackButton}
            >
              <Feather
                name="arrow-left"
                size={24}
                color={editingNote.textcolor || getTextColor()}
              />
            </TouchableOpacity>

            <View style={styles.editorHeaderRight}>
              <TouchableOpacity>
                <Feather
                  name="bell"
                  size={18}
                  color={editingNote?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>
              <View style={styles.zoomBtnsArea}>
                <TouchableOpacity
                  style={styles.editorHeaderButton}
                  onPress={() => {
                    const newSize = Math.min((editingNote.font || 19) + 1, 25);
                    updateFontSize(editingNote.id, "increase");
                    // Also update local editingNote state for immediate visual feedback
                    setEditingNote({
                      ...editingNote,
                      font: newSize,
                    });
                  }}
                >
                  <Feather
                    name="plus"
                    size={18}
                    color={editingNote?.color === "#e5e3e3" ? "#333" : "white"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editorHeaderButton}
                  onPress={() => {
                    const newSize = Math.max((editingNote.font || 19) - 1, 12);
                    updateFontSize(editingNote.id, "decrease");
                    // Also update local editingNote state for immediate visual feedback
                    setEditingNote({
                      ...editingNote,
                      font: newSize,
                    });
                  }}
                >
                  <Feather
                    name="minus"
                    size={18}
                    color={editingNote?.color === "#e5e3e3" ? "#333" : "white"}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.editorHeaderButton}
                onPress={() => {
                  archiveNote(editingNote.id);
                  closeEditorAndSave();
                }}
              >
                <Feather
                  name="archive"
                  size={18}
                  color={editingNote?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editorHeaderButton}
                onPress={changeColorInEditor}
              >
                <Feather
                  name="sliders"
                  size={18}
                  color={editingNote?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editorHeaderButton}
                onPress={togglePinInEditor}
              >
                <FontAwesome
                  name="thumb-tack"
                  size={18}
                  color={
                    editingNote?.pinned
                      ? "gray"
                      : editingNote?.color === "#e5e3e3" ||
                          editingNote?.textcolor === "gray"
                        ? "#333"
                        : "white"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editorHeaderButton}
                onPress={deletePostFromEditor}
              >
                <Feather
                  name="trash-2"
                  size={18}
                  color={editingNote?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.editorScrollView}
              contentContainerStyle={styles.editorScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              bounces={true}
            >
              <View style={styles.editorPostInfo}>
                <TextInput
                  style={[
                    styles.editorTitleInput,
                    {
                      color: editingNote.textcolor || "#666",
                      borderBottomColor: editingNote.textcolor || "#666",
                    },
                  ]}
                  value={editingNoteTitle}
                  onChangeText={setEditingNoteTitle}
                  placeholder="Enter title..."
                  placeholderTextColor={
                    editingNote.textcolor === "white"
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.4)"
                  }
                />
                <Text
                  style={[
                    styles.editorPostDate,
                    {
                      color: editingNote.textcolor || "#666",
                    },
                  ]}
                >
                  Last updated: {editingNote.date} {editingNote.time}
                </Text>
              </View>

              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
              >
                <TextInput
                  ref={textInputRef}
                  style={[
                    styles.editorTextArea,
                    {
                      color: editingNote.textcolor || "#333",
                      backgroundColor: "transparent",
                      fontSize: editingNote.font,
                    },
                  ]}
                  value={editingNoteText}
                  onChangeText={setEditingNoteText}
                  multiline={true}
                  textAlignVertical="top"
                  placeholder="Write your note here..."
                  placeholderTextColor={
                    isDarkBackground(editingNote.color) ? "#000033" : "white"
                  }
                />
              </KeyboardAvoidingView>
              {/* <View style={{ height: 350 }} /> */}
            </ScrollView>
          </TouchableWithoutFeedback>

          <View style={styles.editorBottomActions} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "column",
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "sans-serif",
  },
  searchIconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: "sans-serif",
  },
  clearSearchButton: {
    padding: 8,
  },
  clearSearchText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  createButtonContainer: {
    marginBottom: 20,
  },
  createButton: {
    flexDirection: "row",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 8,
  },
  mainScrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
    fontFamily: "sans-serif",
  },
  flexContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  flexItem: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  card: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "sans-serif",
    marginBottom: 6,
  },
  postText: {
    fontSize: 10,
    fontFamily: "Inter, sans-serif",
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "sans-serif",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  fullScreenEditor: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  zoomBtnsArea: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
    borderBottomWidth: 0,
  },
  editorBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  editorHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editorHeaderButton: {
    padding: 8,
    //   marginRight: 8,
  },
  editorScrollView: {
    flex: 1,
  },
  editorScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  editorPostInfo: {
    marginBottom: 24,
    marginTop: 12,
  },
  editorTitleInput: {
    fontSize: 25,
    fontWeight: "600",
    fontFamily: "sans-serif",
    marginBottom: 8,
    marginLeft: -3,
    paddingVertical: 4,
  },
  editorPostDate: {
    fontSize: 12,
  },
  editorTextArea: {
    lineHeight: 28,
    textAlignVertical: "top",
    padding: 0,
    margin: 0,
    minHeight: 300,
  },
  editorBottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 0,
    gap: 12,
    marginBottom: 30,
  },
});
