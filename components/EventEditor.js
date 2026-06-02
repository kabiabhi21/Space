// components/EventEditor.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";

export default function EventEditor({
  visible,
  onClose,
  onSaveEvent,
  editingEvent,
  isDarkTheme = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    time: "",
    endDate: "",
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        name: editingEvent.name || "",
        description: editingEvent.description || "",
        location: editingEvent.location || "",
        time: editingEvent.time || "",
        endDate: editingEvent.endDate ? editingEvent.endDate.toString() : "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        location: "",
        time: "",
        endDate: "",
      });
    }
  }, [editingEvent]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter an event name");
      return;
    }
    if (!formData.description.trim()) {
      alert("Please enter a description");
      return;
    }
    if (!formData.time) {
      alert("Please select a time");
      return;
    }
    if (!formData.location.trim()) {
      alert("Please enter a location");
      return;
    }

    onSaveEvent({
      name: formData.name,
      description: formData.description,
      time: formData.time,
      location: formData.location,
      endDate: formData.endDate,
    });
  };

  const getModalContainerBackground = () => {
    return isDarkTheme ? "#1a1a1a" : "#1a1a1a";
  };

  const getInputBackground = () => {
    return isDarkTheme ? "#2a2a2a" : "#333";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: getModalContainerBackground() },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={24} color="white" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Name:</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: getInputBackground() },
                ]}
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter event name..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Description:</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: getInputBackground() },
                ]}
                value={formData.description}
                onChangeText={(value) => handleChange("description", value)}
                placeholder="Enter event description..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time:</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: getInputBackground() },
                ]}
                value={formData.time}
                onChangeText={(value) => handleChange("time", value)}
                placeholder="HH:MM"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date (optional):</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: getInputBackground() },
                ]}
                value={formData.endDate}
                onChangeText={(value) => handleChange("endDate", value)}
                placeholder="Leave empty for single day"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                Enter the ending day number if event spans multiple days
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location:</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: getInputBackground() },
                ]}
                value={formData.location}
                onChangeText={(value) => handleChange("location", value)}
                placeholder="Enter event location..."
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>
                {editingEvent ? "Update Event" : "Save Event"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 8,
  },
  formContainer: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "white",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  input: {
    color: "white",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  helperText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
