// components/Mindmap.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

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

export default function Mindmap({
  mindmaps,
  setMindmaps,
  activeMindmap,
  setActiveMindmap,
  mindmapMode,
  setMindmapMode,
  mindmapInput,
  setMindmapInput,
  mindmapScale,
  setMindmapScale,
  openColorNode,
  setOpenColorNode,
  onCloseSidebar,
  isDarkTheme = false,
  createMindmap,
  updateMindmap,
  deleteMindmap,
  addMindmapNode,
  deleteMindmapNode,
  updateMindmapNode,
  archiveNote,
  archiveMindmap,
}) {
  const getStatusBarStyle = (backgroundColor) => {
    const darkColors = [
      "#1A237E",
      "#0D47A1",
      "#1B5E20",
      "#4A148C",
      "#B71C1C",
      "#E65100",
      "#004D40",
      "#3E2723",
      "#263238",
      "#7B1FA2",
      "#00695C",
      "#AB47BC",
      "#26A69A",
      "#5C6BC0",
      "#EF5350",
      "#000033",
    ];

    if (darkColors.includes(backgroundColor)) {
      return "light-content";
    }
    return "dark-content";
  };

  const saveCurrentMap = () => {
    if (activeMindmap) {
      updateMindmap(activeMindmap.id, activeMindmap);
    }
  };

  const startNewMap = () => {
    createMindmap();
    setMindmapMode("editing");
  };

  const saveMap = () => {
    if (activeMindmap) {
      updateMindmap(activeMindmap.id, activeMindmap);
      setActiveMindmap(null);
      setMindmapMode("idle");
    }
  };

  const renderNode = (node, level = 0) => {
    const children = node.children
      .map((id) => activeMindmap?.nodes.find((n) => n.id === id))
      .filter(Boolean);

    const getIconButtonBackground = () => {
      return isDarkTheme ? "#2a2a2a" : "#f0f0f0";
    };

    const getInputBorderColor = () => {
      return isDarkTheme ? "#3a3a3a" : "#ddd";
    };

    const getInputBackground = () => {
      return isDarkTheme ? "#2a2a2a" : "#fff";
    };

    const getInputTextColor = () => {
      return isDarkTheme ? "#FFFFFF" : "#333";
    };

    const getPaletteBackground = () => {
      return isDarkTheme ? "#2a2a2a" : "#fff";
    };

    const handleAddChild = () => {
      const text = mindmapInput[node.id];
      if (!text || text.trim() === "") return;
      addMindmapNode(node.id, text);
      setMindmapInput((p) => ({ ...p, [node.id]: "" }));
    };

    const handleDeleteNode = () => {
      if (node.parentId !== null) {
        deleteMindmapNode(node.id, node.parentId);
      }
    };

    const handleUpdateNodeColor = (color) => {
      updateMindmapNode(node.id, { color: color.bg, textColor: color.text });
    };

    return (
      <View
        key={node.id}
        style={[styles.nodeContainer, { marginLeft: level === 0 ? 0 : 20 }]}
      >
        <View
          style={[
            styles.node,
            { backgroundColor: node.color || NODE_COLORS[0].bg },
          ]}
        >
          <TextInput
            style={[styles.nodeText, { color: node.textColor || "#FFFFFF" }]}
            value={node.text}
            onChangeText={(text) => updateMindmapNode(node.id, { text })}
            multiline
            placeholder="Enter text..."
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() =>
              setOpenColorNode(openColorNode === node.id ? null : node.id)
            }
            style={[
              styles.iconButton,
              { backgroundColor: getIconButtonBackground() },
            ]}
          >
            <FontAwesome6
              name="brush"
              iconStyle="solid"
              size={16}
              color={isDarkTheme ? "#9ca3af" : "#666"}
            />
          </TouchableOpacity>

          {openColorNode === node.id && (
            <View style={styles.paletteContainer}>
              <View
                style={[
                  styles.palette,
                  { backgroundColor: getPaletteBackground() },
                ]}
              >
                {NODE_COLORS.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      handleUpdateNodeColor(color);
                      setOpenColorNode(null);
                    }}
                    style={[styles.paletteColor, { backgroundColor: color.bg }]}
                  />
                ))}
              </View>
            </View>
          )}

          <TextInput
            style={[
              styles.input,
              {
                borderColor: getInputBorderColor(),
                backgroundColor: getInputBackground(),
                color: getInputTextColor(),
              },
            ]}
            value={mindmapInput[node.id] || ""}
            onChangeText={(text) =>
              setMindmapInput((p) => ({ ...p, [node.id]: text }))
            }
            placeholder="Add sub-topic..."
            placeholderTextColor={isDarkTheme ? "#6b7280" : "#999"}
          />

          <TouchableOpacity
            onPress={handleAddChild}
            style={[
              styles.iconButton,
              { backgroundColor: getIconButtonBackground() },
            ]}
          >
            <FontAwesome6
              name="plus"
              iconStyle="solid"
              size={14}
              color="#4CAF50"
            />
          </TouchableOpacity>

          {node.parentId !== null && (
            <TouchableOpacity
              onPress={handleDeleteNode}
              style={[
                styles.iconButton,
                { backgroundColor: getIconButtonBackground() },
              ]}
            >
              <FontAwesome6
                name="trash-can"
                iconStyle="solid"
                size={14}
                color="#000033"
              />
            </TouchableOpacity>
          )}
        </View>

        {children.length > 0 && (
          <View style={styles.children}>
            {children.map((child) => (
              <View key={child.id} style={styles.childRow}>
                <View
                  style={[
                    styles.horizontalLine,
                    isDarkTheme && { backgroundColor: "#4b5563" },
                  ]}
                />
                {renderNode(child, level + 1)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getBackgroundColor = () => {
    return isDarkTheme ? "#1a1a1a" : "#f5f5f5";
  };

  const getHeaderTitleColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getCreateButtonBorderColor = () => {
    return isDarkTheme ? "#3a3a3a" : "#000033";
  };

  const getCreateButtonTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getEmptyTextColor = () => {
    return isDarkTheme ? "#6b7280" : "#999";
  };

  const getEmptySubTextColor = () => {
    return isDarkTheme ? "#4b5563" : "#bbb";
  };

  const getMapCardBorderColor = () => {
    return isDarkTheme ? "#2a2a2a" : "#e0e0e0";
  };

  const getMapCardTitleColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#333";
  };

  const getMapCardDateColor = () => {
    return isDarkTheme ? "#6b7280" : "#999";
  };

  const getDeleteMapButtonColor = () => {
    return isDarkTheme ? "#9ca3af" : "#000033";
  };

  const getEditorHeaderBorderColor = () => {
    return isDarkTheme ? "#2a2a2a" : "#e0e0e0";
  };

  const getSaveButtonTextColor = () => {
    return isDarkTheme ? "white" : "#000033";
  };

  const getZoomButtonBackground = () => {
    return isDarkTheme ? "#2a2a2a" : "#f0f0f0";
  };

  const getZoomButtonColor = () => {
    return isDarkTheme ? "#9ca3af" : "#666";
  };

  if (mindmapMode === "idle") {
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
          <Text style={[styles.headerTitle, { color: getHeaderTitleColor() }]}>
            Mindmap
          </Text>
        </View>

        <View style={styles.centerContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { borderColor: getCreateButtonBorderColor() },
            ]}
            onPress={startNewMap}
          >
            <Feather name="plus" size={20} color={getCreateButtonTextColor()} />
            <Text
              style={[
                styles.createButtonText,
                { color: getCreateButtonTextColor() },
              ]}
            >
              NEW MAP
            </Text>
          </TouchableOpacity>
        </View>

        {mindmaps.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: getEmptyTextColor() }]}>
              NO MINDMAPS YET
            </Text>
            <Text
              style={[styles.emptySubText, { color: getEmptySubTextColor() }]}
            >
              Create your first mindmap to organize your thoughts
            </Text>
          </View>
        )}

        {mindmaps.map((map) => {
          const rootNode = map.nodes.find((n) => n.parentId === null);
          return (
            <TouchableOpacity
              key={map.id}
              style={[
                styles.mapCard,
                { borderBottomColor: getMapCardBorderColor() },
              ]}
              onPress={() => {
                setActiveMindmap(JSON.parse(JSON.stringify(map)));
                setMindmapMode("editing");
              }}
              activeOpacity={0.7}
            >
              <View style={styles.mapCardContent}>
                <View
                  style={[
                    styles.mapCardColor,
                    { backgroundColor: rootNode?.color || NODE_COLORS[0].bg },
                  ]}
                />
                <View style={styles.mapCardInfo}>
                  <Text
                    style={[
                      styles.mapCardTitle,
                      { color: getMapCardTitleColor() },
                    ]}
                  >
                    {rootNode?.text || "Untitled"}
                  </Text>
                  <Text
                    style={[
                      styles.mapCardDate,
                      { color: getMapCardDateColor() },
                    ]}
                  >
                    Updated: {new Date(map.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  deleteMindmap(map.id);
                }}
                style={styles.deleteMapButton}
              >
                <FontAwesome6
                  name="trash-can"
                  iconStyle="solid"
                  size={20}
                  color={getDeleteMapButtonColor()}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  }

  const root = activeMindmap?.nodes.find((n) => n.parentId === null);

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={getBackgroundColor()}
        translucent={false}
      />
      <View
        style={[
          styles.editorHeader,
          { borderBottomColor: getEditorHeaderBorderColor() },
        ]}
      >
        <TouchableOpacity onPress={saveMap} style={styles.saveButton}>
          <FontAwesome6
            name="floppy-disk"
            iconStyle="solid"
            size={20}
            color={getSaveButtonTextColor()}
          />
          <Text
            style={[styles.saveButtonText, { color: getSaveButtonTextColor() }]}
          >
            SAVE MAP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            archiveMindmap(activeMindmap.id);
            setMindmapMode("idle");
            setActiveMindmap(null);
          }}
          style={styles.archiveButton}
        >
          <FontAwesome6
            name="box-archive"
            iconStyle="solid"
            size={20}
            color={getSaveButtonTextColor()}
          />
        </TouchableOpacity>

        <View style={styles.zoomControls}>
          <TouchableOpacity
            onPress={() => setMindmapScale((s) => Math.max(0.5, s - 0.1))}
            style={[
              styles.zoomButton,
              { backgroundColor: getZoomButtonBackground() },
            ]}
          >
            <FontAwesome6
              name="magnifying-glass-minus"
              iconStyle="solid"
              size={18}
              color={getZoomButtonColor()}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMindmapScale(1)}
            style={[
              styles.zoomButton,
              { backgroundColor: getZoomButtonBackground() },
            ]}
          >
            <FontAwesome6
              name="arrows-rotate"
              iconStyle="solid"
              size={18}
              color={getZoomButtonColor()}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMindmapScale((s) => Math.min(2, s + 0.1))}
            style={[
              styles.zoomButton,
              { backgroundColor: getZoomButtonBackground() },
            ]}
          >
            <FontAwesome6
              name="magnifying-glass-plus"
              iconStyle="solid"
              size={18}
              color={getZoomButtonColor()}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.mindmapScrollView}
        contentContainerStyle={styles.mindmapContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ transform: [{ scale: mindmapScale }] }}>
          {root && renderNode(root)}
        </View>
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
    marginTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  centerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  createButton: {
    flexDirection: "row",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    gap: 2,
  },
  createButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
  mapCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  mapCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mapCardColor: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  mapCardInfo: {
    gap: 4,
  },
  mapCardTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  mapCardDate: {
    fontSize: 12,
  },
  deleteMapButton: {
    padding: 8,
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  zoomControls: {
    flexDirection: "row",
    gap: 12,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  mindmapScrollView: {
    flex: 1,
  },
  mindmapContent: {
    paddingBottom: 40,
  },
  nodeContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  node: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 3,
    alignSelf: "flex-start",
    minWidth: 120,
  },
  nodeText: {
    fontSize: 16,
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    minWidth: 120,
  },
  paletteContainer: {
    position: "absolute",
    top: 30,
    left: 0,
    zIndex: 100,
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 160,
  },
  paletteColor: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  children: {
    borderLeftWidth: 2,
    borderLeftColor: "#9ca3af",
    marginLeft: 12,
    paddingLeft: 16,
  },
  childRow: {
    flexDirection: "row",
  },
  horizontalLine: {
    width: 12,
    height: 2,
    backgroundColor: "#9ca3af",
    marginTop: 20,
    marginRight: 8,
  },
});
