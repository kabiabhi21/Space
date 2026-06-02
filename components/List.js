// components/List.js
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  BackHandler,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";

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

export default function List({
  lists,
  setLists,
  listsSearchTerm,
  setListsSearchTerm,
  listsShowSearch,
  setListsShowSearch,
  editingList,
  setEditingList,
  editingListTitle,
  setEditingListTitle,
  newTaskText,
  setNewTaskText,
  editingTasks,
  setEditingTasks,
  onEditingPostColorChange,
  onCloseSidebar,
  isDarkTheme = false,
  createList,
  updateList,
  deleteList,
  changeListColor,
  toggleListPin,
  addTaskToList,
  toggleTaskCompletion,
  deleteTask,
  archiveList,
}) {
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    if (onEditingPostColorChange) {
      onEditingPostColorChange(editingList?.color || null);
    }
  }, [editingList, onEditingPostColorChange]);

  useEffect(() => {
    if (editingList !== null) {
      // Find the latest version of this list from parent
      const currentList = lists.find((list) => list.id === editingList.id);

      if (currentList) {
        // Only sync tasks from parent updates
        setEditingTasks(currentList.tasks || []);
      }
    }
  }, [lists, editingList?.id]);

  useEffect(() => {
    const backAction = () => {
      if (editingList !== null) {
        // Check if tasks or title changed
        const hasTaskChanges =
          JSON.stringify(editingTasks) !== JSON.stringify(editingList.tasks);
        const hasTitleChanges = editingListTitle !== editingList.title;

        if (hasTaskChanges || hasTitleChanges) {
          saveCurrentEdit();
        }
        setEditingList(null);
        setEditingListTitle("");
        setEditingTasks([]);
        setNewTaskText("");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [editingList, editingListTitle, editingTasks]);

  const getBorderColor = (color) => {
    if (isDarkTheme && (color === "#e5e3e3" || color === "#f5f5f5")) {
      return "#3a3a3a";
    }
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
      "#000000": "#424242",
    };
    return colorMap[color] || "#424242";
  };

  const saveCurrentEdit = () => {
    if (editingList !== null) {
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

      // Use editingTasks directly instead of from state
      updateList(editingList.id, {
        title: editingListTitle === "" ? "Untitled List" : editingListTitle,
        tasks: editingTasks,
        time: time,
        date: dateStr,
      });
    }
  };

  const closeEditorAndSave = () => {
    // Only save if content actually changed
    const hasTaskChanges =
      JSON.stringify(editingTasks) !== JSON.stringify(editingList?.tasks || []);
    const hasTitleChanges = editingListTitle !== editingList?.title;

    if (hasTaskChanges || hasTitleChanges) {
      saveCurrentEdit();
    }
    setEditingList(null);
    setEditingListTitle("");
    setEditingTasks([]);
    setNewTaskText("");
  };

  const openListEditor = (list) => {
    setEditingList(list);
    setEditingListTitle(list.title || "");
    setEditingTasks([...list.tasks]);
  };

  const deleteListFromEditor = () => {
    Alert.alert("Delete List", "Are you sure you want to delete this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          deleteList(editingList.id);
          setEditingList(null);
          setEditingListTitle("");
          setEditingTasks([]);
          setNewTaskText("");
        },
        style: "destructive",
      },
    ]);
  };

  const changeColorInEditor = () => {
    if (!editingList) return;
    changeListColor(editingList.id);

    const currentIndex =
      editingList.colorIndex !== undefined ? editingList.colorIndex : 0;
    const nextIndex = (currentIndex + 1) % COLOR_ARRAY.length;
    setEditingList({
      ...editingList,
      colorIndex: nextIndex,
      color: COLOR_ARRAY[nextIndex].bg,
      textcolor: COLOR_ARRAY[nextIndex].text,
    });
  };

  const clearSearch = () => {
    setListsSearchTerm("");
    setListsShowSearch(false);
  };

  const addTask = () => {
    if (newTaskText.trim() === "") return;
    addTaskToList(editingList.id, newTaskText);
    setNewTaskText("");
  };

  const handleToggleTaskCompletion = (taskId) => {
    toggleTaskCompletion(editingList.id, taskId);
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(editingList.id, taskId);
  };

  const filteredLists =
    listsSearchTerm.trim() === ""
      ? lists
      : lists.filter(
          (list) =>
            list.title.toLowerCase().includes(listsSearchTerm.toLowerCase()) ||
            list.tasks.some((task) =>
              task.text.toLowerCase().includes(listsSearchTerm.toLowerCase()),
            ),
        );

  const pinnedLists = filteredLists.filter((list) => list.pinned);
  const unpinnedLists = filteredLists.filter((list) => !list.pinned);
  const unpinnedListsForDisplay = [...unpinnedLists].reverse();

  const formatListsForGrid = (listsArray) => {
    const gridData = [];
    for (let i = 0; i < listsArray.length; i += 2) {
      gridData.push({
        left: listsArray[i],
        right: listsArray[i + 1] || null,
      });
    }
    return gridData;
  };

  const pinnedGridData = formatListsForGrid(pinnedLists);
  const unpinnedGridData = formatListsForGrid(unpinnedListsForDisplay);

  const getTaskSummary = (tasks) => {
    if (!tasks || tasks.length === 0) return "No tasks";
    const completedCount = tasks.filter((t) => t.completed).length;
    return `${completedCount}/${tasks.length} tasks completed`;
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        onPress={() => handleToggleTaskCompletion(item.id)}
        style={styles.checkboxContainer}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor:
                editingList?.textcolor === "#FFFFFF" ? "#fff" : "#666",
            },
            item.completed && styles.checkboxChecked,
          ]}
        >
          {item.completed && (
            <Feather
              name="check"
              size={12}
              color={editingList?.color === "#e5e3e3" ? "#202124" : "#fff"}
            />
          )}
        </View>
      </TouchableOpacity>
      <Text
        style={[
          styles.taskText,
          item.completed && styles.completedTaskText,
          { color: editingList?.textcolor || "#333" },
        ]}
      >
        {item.text}
      </Text>
      <TouchableOpacity
        onPress={() => handleDeleteTask(item.id)}
        style={styles.deleteTaskButton}
      >
        <Feather
          name="trash-2"
          size={16}
          color={
            editingList?.textcolor === "#FFFFFF"
              ? "rgba(255,255,255,0.6)"
              : "#999"
          }
        />
      </TouchableOpacity>
    </View>
  );

  const renderGridSection = (gridData, sectionTitle, showTitle = true) => {
    if (gridData.length === 0) return null;

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
        <FlatList
          data={gridData}
          keyExtractor={(item, index) => `${sectionTitle}-${index}`}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.gridRow}>
              {item.left && (
                <TouchableOpacity
                  style={[
                    styles.gridCard,
                    {
                      backgroundColor: item.left.color,
                      borderColor: getBorderColor(item.left.color),
                    },
                  ]}
                  onPress={() => openListEditor(item.left)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: item.left.textcolor },
                        ]}
                        numberOfLines={1}
                      >
                        {item.left.title || "Untitled List"}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleListPin(item.left.id);
                        }}
                        style={styles.pinButton}
                      >
                        <Feather
                          name="map-pin"
                          size={14}
                          color={
                            item.left.pinned ? "#FFD700" : item.left.textcolor
                          }
                          style={{ opacity: item.left.pinned ? 1 : 0.5 }}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={[styles.postText, { color: item.left.textcolor }]}
                      numberOfLines={2}
                    >
                      {getTaskSummary(item.left.tasks)}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text
                        style={[
                          styles.postDate,
                          { color: item.left.textcolor },
                        ]}
                      >
                        {item.left.date}
                      </Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            changeListColor(item.left.id);
                          }}
                          style={styles.cardActionButton}
                        >
                          <Feather
                            name="sliders"
                            size={14}
                            color={item.left.textcolor}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteList(item.left.id);
                          }}
                          style={styles.cardActionButton}
                        >
                          <Feather
                            name="trash-2"
                            size={14}
                            color={item.left.textcolor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {item.right ? (
                <TouchableOpacity
                  style={[
                    styles.gridCard,
                    {
                      backgroundColor: item.right.color,
                      borderColor: getBorderColor(item.right.color),
                    },
                  ]}
                  onPress={() => openListEditor(item.right)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: item.right.textcolor },
                        ]}
                        numberOfLines={1}
                      >
                        {item.right.title || "Untitled List"}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleListPin(item.right.id);
                        }}
                        style={styles.pinButton}
                      >
                        <Feather
                          name="map-pin"
                          size={14}
                          color={
                            item.right.pinned ? "#FFD700" : item.right.textcolor
                          }
                          style={{ opacity: item.right.pinned ? 1 : 0.5 }}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={[styles.postText, { color: item.right.textcolor }]}
                      numberOfLines={2}
                    >
                      {getTaskSummary(item.right.tasks)}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text
                        style={[
                          styles.postDate,
                          { color: item.right.textcolor },
                        ]}
                      >
                        {item.right.date}
                      </Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            changeListColor(item.right.id);
                          }}
                          style={styles.cardActionButton}
                        >
                          <Feather
                            name="sliders"
                            size={14}
                            color={item.right.textcolor}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteList(item.right.id);
                          }}
                          style={styles.cardActionButton}
                        >
                          <Feather
                            name="trash-2"
                            size={14}
                            color={item.right.textcolor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.gridCard, styles.emptyCard]} />
              )}
            </View>
          )}
        />
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
          <Text style={[styles.title, { color: getTextColor() }]}>Lists</Text>
        </View>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => setListsShowSearch(!listsShowSearch)}
          activeOpacity={0.7}
        >
          <Feather name="search" size={24} color={getTextColor()} />
        </TouchableOpacity>
      </View>

      {listsShowSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, getSearchInputStyle()]}
            placeholder="Search Lists..."
            placeholderTextColor={isDarkTheme ? "#6b7280" : "#999"}
            value={listsSearchTerm}
            onChangeText={setListsSearchTerm}
            autoFocus={true}
          />
          {listsSearchTerm !== "" && (
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
          onPress={createList}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={20} color={getCreateButtonTextColor()} />
          <Text
            style={[
              styles.createButtonText,
              { color: getCreateButtonTextColor() },
            ]}
          >
            NEW LIST
          </Text>
        </TouchableOpacity>
      </View>

      {filteredLists.length === 0 && listsSearchTerm !== "" && (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            No lists matching "{listsSearchTerm}"
          </Text>
        </View>
      )}

      {filteredLists.length === 0 && listsSearchTerm === "" && (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: isDarkTheme ? "#6b7280" : "#999" },
            ]}
          >
            NO LISTS YET
          </Text>
          <Text
            style={[
              styles.emptySubText,
              { color: isDarkTheme ? "#4b5563" : "#bbb" },
            ]}
          >
            Your lists will be saved automatically
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderGridSection(pinnedGridData, "Pinned", pinnedLists.length > 0)}
        {renderGridSection(
          unpinnedGridData,
          "Other Lists",
          pinnedLists.length > 0 && unpinnedListsForDisplay.length > 0,
        )}
        <View style={{ height: Platform.OS === "ios" ? 120 : 80 }} />
      </ScrollView>

      {editingList !== null && (
        <View
          style={[
            styles.fullScreenEditor,
            {
              backgroundColor:
                editingList.color || (isDarkTheme ? "#1a1a1a" : "whitesmoke"),
            },
          ]}
        >
          <StatusBar
            barStyle={
              editingList.textcolor === "#E8EAF6" ||
              editingList.textcolor === "#FFFFFF" ||
              editingList.color === "#1A237E" ||
              editingList.color === "#1B5E20" ||
              editingList.color === "#0D47A1" ||
              editingList.color === "#4A148C" ||
              editingList.color === "#311B92" ||
              editingList.color === "#B71C1C" ||
              editingList.color === "#3E2723" ||
              editingList.color === "#263238" ||
              editingList.color === "#000000"
                ? "light-content"
                : "dark-content"
            }
            backgroundColor={editingList.color}
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
                color={editingList.textcolor || getTextColor()}
              />
            </TouchableOpacity>

            <View style={styles.editorHeaderRight}>
              <TouchableOpacity
                style={[styles.editorHeaderButton]}
                onPress={() => {
                  archiveList(editingList.id);
                  closeEditorAndSave();
                }}
              >
                <Feather
                  name="archive"
                  size={20}
                  color={editingList?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editorHeaderButton]}
                onPress={changeColorInEditor}
              >
                <Feather
                  name="sliders"
                  size={20}
                  color={editingList?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editorHeaderButton]}
                onPress={deleteListFromEditor}
              >
                <Feather
                  name="trash-2"
                  size={20}
                  color={editingList?.color === "#e5e3e3" ? "#333" : "white"}
                />
              </TouchableOpacity>
            </View>
          </View>

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
                    color: editingList.textcolor || "#666",
                    borderBottomColor: editingList.textcolor || "#666",
                  },
                ]}
                value={editingListTitle ?? ""}
                onChangeText={setEditingListTitle}
                placeholder="Enter list title..."
                placeholderTextColor={
                  editingList?.color === "#e5e3e3" ||
                  editingList?.color === "whitesmoke" ||
                  editingList?.color === "#f5f5f5"
                    ? "#000033"
                    : "#f5f5f5"
                }
              />
              <Text
                style={[
                  styles.editorPostDate,
                  {
                    color: editingList.textcolor || "#666",
                  },
                ]}
              >
                Last updated: {editingList.date} {editingList.time}
              </Text>
            </View>

            <FlatList
              data={editingTasks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTaskItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyTasksText,
                    {
                      color:
                        editingList.color === "#e5e3e3" ? "#000033" : "white",
                    },
                  ]}
                >
                  No tasks yet. Add one below!
                </Text>
              }
            />

            <View style={styles.addTaskContainer}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.addTaskInput,
                  {
                    color: editingList.textcolor || "#333",
                    borderBottomColor:
                      editingList.textcolor === "#FFFFFF"
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(0,0,0,0.2)",
                  },
                ]}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="Add a new task..."
                placeholderTextColor={
                  editingList?.color === "#e5e3e3" ||
                  editingList?.color === "whitesmoke" ||
                  editingList?.color === "#f5f5f5"
                    ? "#000033"
                    : "#FFFFFF"
                }
                onSubmitEditing={addTask}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={addTask}
                activeOpacity={0.7}
              >
                <Feather
                  name="plus"
                  size={20}
                  color={editingList.textcolor || "#333"}
                />
              </TouchableOpacity>
              <View style={{ height: 260 }}></View>
            </View>

            <View style={{ height: 150 }} />
          </ScrollView>

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
  createButtonText: {
    fontSize: 16,
    fontFamily: "sans-serif",
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
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    padding: 12,
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "sans-serif",
    flex: 1,
    marginRight: 8,
  },
  pinButton: {
    padding: 4,
  },
  postText: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "sans-serif",
    lineHeight: 18,
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
  },
  postDate: {
    fontSize: 10,
    fontFamily: "sans-serif",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  cardActionButton: {
    padding: 4,
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
    gap: 8,
  },
  editorHeaderButton: {
    padding: 8,
    marginRight: 8,
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
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "sans-serif",
    marginBottom: 8,
    marginLeft: -3,
    paddingVertical: 4,
  },
  editorPostDate: {
    fontSize: 12,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "transparent",
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  deleteTaskButton: {
    padding: 8,
  },
  addTaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  addTaskInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addTaskButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyTasksText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
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
