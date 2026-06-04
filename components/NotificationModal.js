// components/NotificationModal.js
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";

// Configure notification handler for foreground (app is open)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export default function NotificationModal({
  visible,
  onClose,
  day,
  date,
  selectedDate,
  currentYear,
  currentMonth,
  isDarkTheme = false,
}) {
  const [time, setTime] = useState(new Date());
  const [note, setNote] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Format the reminder date
  const getReminderDateTime = () => {
    const reminderDate = new Date(currentYear, currentMonth, selectedDate);
    reminderDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return reminderDate;
  };

  // Request notification permissions
  const requestPermissions = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please enable notifications to set reminders",
      );
      return false;
    }
    return true;
  };

  // Setup Android notification channel
  const setupAndroidChannel = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("calendar_reminders", {
        name: "Calendar Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#000033",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        //sound: "default",
      });
    }
  };

  // Schedule the notification
  const scheduleReminder = async () => {
    if (!note.trim()) {
      Alert.alert("Missing Info", "Please enter a reminder note");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      // Step 2: Setup Android channel
      await setupAndroidChannel();

      // Step 3: Get the reminder date and time
      const reminderDateTime = getReminderDateTime();

      // Check if reminder date is in the future
      if (reminderDateTime <= new Date()) {
        Alert.alert("Invalid Time", "Please select a future time");
        setIsLoading(false);
        return;
      }

      // Step 4: Schedule the notification with CORRECT trigger format
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder for ${day} ${date}`,
          body: note,
          data: {
            date: selectedDate,
            month: currentMonth,
            year: currentYear,
            day: day,
            ordinalDate: date,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDateTime,
          channelId: "calendar_reminders",
        },
      });

      console.log("Notification scheduled with ID:", notificationId);

      // Debug logs
      console.log("Reminder Date:", reminderDateTime.toString());

      console.log("Current Date:", new Date().toString());

      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      console.log(
        "Scheduled Notifications:",
        JSON.stringify(scheduledNotifications, null, 2),
      );

      console.log("Notification scheduled with ID:", notificationId);

      Alert.alert(
        "Reminder Set!",
        `Reminder scheduled for ${day} ${date} at ${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );

      // Reset form and close modal
      setNote("");
      setTime(new Date());
      onClose();
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("Error", `Failed to set reminder: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            isDarkTheme && styles.modalContainerDark,
          ]}
        >
          <Text style={[styles.title, isDarkTheme && styles.textDark]}>
            Set Reminder
          </Text>

          <Text style={[styles.dateText, isDarkTheme && styles.textDark]}>
            {day}, {date}
          </Text>

          {/* Time Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkTheme && styles.textDark]}>
              Time
            </Text>
            <TouchableOpacity
              style={[styles.timeButton, isDarkTheme && styles.timeButtonDark]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.timeText, isDarkTheme && styles.textDark]}>
                {time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Picker (iOS uses inline, Android uses modal) */}
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}

          {/* Note Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkTheme && styles.textDark]}>
              Reminder Note
            </Text>
            <TextInput
              style={[styles.input, isDarkTheme && styles.inputDark]}
              placeholder="Enter reminder note..."
              placeholderTextColor={isDarkTheme ? "#888" : "#999"}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={scheduleReminder}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? "Setting..." : "Set Reminder"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainerDark: {
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#000033",
  },
  dateText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000033",
  },
  timeButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  timeButtonDark: {
    borderColor: "#444",
    backgroundColor: "#2a2a2a",
  },
  timeText: {
    fontSize: 16,
    color: "#000033",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
  },
  inputDark: {
    borderColor: "#444",
    backgroundColor: "#2a2a2a",
    color: "#fff",
  },
  textDark: {
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#38BDF8",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
