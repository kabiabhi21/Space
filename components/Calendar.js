// components/Calendar.js
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import EventEditor from "./EventEditor";

const { width: screenWidth } = Dimensions.get("window");

export default function Calendar({
  events,
  setEvents,
  moods,
  setMoods,
  dateColors,
  setDateColors,
  calendarCurrentView,
  setCalendarCurrentView,
  currentMonth,
  setCurrentMonth,
  currentYear,
  setCurrentYear,
  yearViewYear,
  setYearViewYear,
  selectedDate,
  setSelectedDate,
  eventViewerActive,
  setEventViewerActive,
  showEventEditor,
  setShowEventEditor,
  editingEvent,
  setEditingEvent,
  deleteWarningActive,
  setDeleteWarningActive,
  eventToDelete,
  setEventToDelete,
  viewerBg,
  setViewerBg,
  onCloseSidebar,
  onViewChange,
  isDarkTheme = false,
  addEvent,
  updateEvent,
  deleteEvent,
  addMood,
  updateMood,
}) {
  const STORAGE_KEYS = {
    EVENTS: "@calendar_events",
    MOODS: "@calendar_moods",
    DATE_COLORS: "@calendar_date_colors",
  };

  useEffect(() => {
    return () => {
      if (onViewChange) {
        onViewChange("month");
      }
    };
  }, [onViewChange]);

  const getWeeks = (month = currentMonth, year = currentYear) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayIndex = firstDayOfMonth.getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    const weeks = [];
    let currentDay = 1;

    const firstWeek = Array(7).fill(null);
    for (let i = firstDayIndex; i < 7 && currentDay <= totalDays; i++) {
      firstWeek[i] = currentDay++;
    }
    weeks.push(firstWeek);

    while (currentDay <= totalDays) {
      const week = Array(7).fill(null);
      for (let i = 0; i < 7 && currentDay <= totalDays; i++) {
        week[i] = currentDay++;
      }
      weeks.push(week);
    }

    return weeks;
  };

  const getAllMonthsForYear = (year) => {
    const monthsData = [];
    for (let month = 0; month < 12; month++) {
      const firstDayOfMonth = new Date(year, month, 1);
      const firstDayIndex = firstDayOfMonth.getDay();
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const totalDays = lastDayOfMonth.getDate();

      const weeks = [];
      let currentDay = 1;
      const firstWeek = Array(7).fill(null);
      for (let i = firstDayIndex; i < 7 && currentDay <= totalDays; i++) {
        firstWeek[i] = currentDay++;
      }
      weeks.push(firstWeek);

      while (currentDay <= totalDays) {
        const week = Array(7).fill(null);
        for (let i = 0; i < 7 && currentDay <= totalDays; i++) {
          week[i] = currentDay++;
        }
        weeks.push(week);
      }

      monthsData.push({
        monthNumber: month,
        monthName: firstDayOfMonth.toLocaleString("default", {
          month: "short",
        }),
        fullMonthName: firstDayOfMonth.toLocaleString("default", {
          month: "long",
        }),
        weeks,
        totalDays,
      });
    }
    return monthsData;
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setCalendarCurrentView("month");
  };

  const handleYearButtonClick = () => {
    setYearViewYear(currentYear);
    setCalendarCurrentView("year");
    if (onViewChange) {
      onViewChange("year");
    }
  };

  const handleMonthButtonClick = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setCalendarCurrentView("month");
    if (onViewChange) {
      onViewChange("month");
    }
  };

  const updateEventViewer = (date) => {
    setSelectedDate(date);
    setEventViewerActive(true);
  };

  const closeEventViewer = () => {
    setEventViewerActive(false);
    setSelectedDate(null);
  };

  const addEventForSelectedDate = () => {
    setShowEventEditor(true);
  };

  const handleSaveEvent = (eventData) => {
    if (!selectedDate) return;

    const startDate = parseInt(selectedDate);
    const endDate = eventData.endDate ? parseInt(eventData.endDate) : startDate;
    const actualStartDate = Math.min(startDate, endDate);
    const actualEndDate = Math.max(startDate, endDate);

    const eventDates = [];
    for (let d = actualStartDate; d <= actualEndDate; d++) {
      eventDates.push(d);
    }

    const dateKeys = eventDates.map(
      (date) => `${currentYear}-${currentMonth + 1}-${date}`,
    );
    const totalDays = eventDates.length;

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        name: eventData.name,
        description: eventData.description,
        time: eventData.time,
        location: eventData.location,
        startDate: actualStartDate,
        endDate: actualEndDate,
        totalDays: totalDays,
        eventDates: eventDates,
        dateKeys: dateKeys,
      });
      setEditingEvent(null);
    } else {
      addEvent({
        startDate: actualStartDate,
        endDate: actualEndDate,
        totalDays: totalDays,
        eventDates: eventDates,
        dateKeys: dateKeys,
        month: currentMonth,
        year: currentYear,
        name: eventData.name,
        description: eventData.description,
        time: eventData.time,
        location: eventData.location,
      });
    }
    setShowEventEditor(false);
  };

  const handleEditEvent = (eventId) => {
    const eventToEdit = events.find((e) => e.id === eventId);
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setShowEventEditor(true);
      closeEventViewer();
    }
  };

  const onEventDelete = (eventId) => {
    setEventToDelete(eventId);
    setDeleteWarningActive(true);
  };

  const confirmDelete = () => {
    if (!eventToDelete) {
      setDeleteWarningActive(false);
      return;
    }

    const eventToRemove = events.find((e) => e.id === eventToDelete);
    deleteEvent(eventToDelete);

    if (eventToRemove && eventToRemove.dateKeys) {
      const newColors = { ...dateColors };
      eventToRemove.dateKeys.forEach((dateKey) => {
        delete newColors[dateKey];
      });
      setDateColors(newColors);
    }

    setDeleteWarningActive(false);
    setEventToDelete(null);

    if (eventToRemove && selectedDate) {
      const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDate}`;
      const remainingEvents = events.filter(
        (e) => e.dateKeys && e.dateKeys.includes(dateKey),
      );
      if (remainingEvents.length === 0) {
        setEventViewerActive(false);
      }
    }

    Alert.alert("Success", "Event deleted successfully!");
  };

  const cancelDelete = () => {
    setDeleteWarningActive(false);
    setEventToDelete(null);
  };

  const handleMood = () => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    if (todayMonth !== currentMonth || todayYear !== currentYear) {
      Alert.alert("Info", "Navigate to current month to add mood");
      return;
    }

    Alert.prompt(
      "Add Mood",
      "Enter your mood (emoji or text):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: (mood) => {
            if (!mood || mood.trim() === "") return;

            const dateKey = `${todayYear}-${todayMonth + 1}-${todayDate}`;
            const existingMoodIndex = moods.findIndex(
              (item) => item.dateKey === dateKey,
            );

            if (existingMoodIndex !== -1) {
              updateMood(moods[existingMoodIndex].id, { mood: mood });
              Alert.alert("Success", "Mood updated for today!");
            } else {
              const newMood = {
                id: Date.now(),
                dateKey: dateKey,
                date: todayDate,
                month: todayMonth,
                year: todayYear,
                mood: mood,
              };
              addMood(newMood);
              Alert.alert("Success", "Mood added for today!");
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const getMoodForDate = (date) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${date}`;
    const moodEntry = moods.find((item) => item.dateKey === dateKey);
    return moodEntry ? moodEntry.mood : null;
  };

  const hasEventsForDate = (date) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${date}`;
    return events.some(
      (item) => item.dateKeys && item.dateKeys.includes(dateKey),
    );
  };

  const getEventColorForDate = (date) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${date}`;
    if (dateColors[dateKey]) return dateColors[dateKey];
    const eventForDate = events.find(
      (item) => item.dateKeys && item.dateKeys.includes(dateKey),
    );
    return eventForDate ? "#000033" : "transparent";
  };

  const updateEventViewerBackgroundColor = (color) => {
    if (!selectedDate) return;
    const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDate}`;
    setViewerBg(color);
    if (hasEventsForDate(selectedDate)) {
      setDateColors((prev) => ({ ...prev, [dateKey]: color }));
    }
  };

  const getOrdinalSuffix = (date) => {
    if (!date) return "";
    const lastDigit = date % 10;
    const lastTwoDigits = date % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${date}th`;
    switch (lastDigit) {
      case 1:
        return `${date}st`;
      case 2:
        return `${date}nd`;
      case 3:
        return `${date}rd`;
      default:
        return `${date}th`;
    }
  };

  const getDayForDate = (date) => {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return dayNames[new Date(currentYear, currentMonth, date).getDay()];
  };

  const needsConnectionToRight = (date) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${date}`;
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (date === lastDayOfMonth) return false;
    for (const ev of events) {
      if (ev.dateKeys && ev.dateKeys.includes(dateKey)) {
        const nextDateKey = `${currentYear}-${currentMonth + 1}-${date + 1}`;
        if (ev.dateKeys.includes(nextDateKey)) return true;
      }
    }
    return false;
  };

  const EventViewer = () => {
    if (!eventViewerActive || !selectedDate) return null;

    const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDate}`;
    const eventsForSelectedDate = events.filter(
      (item) => item.dateKeys && item.dateKeys.includes(dateKey),
    );
    const moodForSelectedDate = moods.find((item) => item.dateKey === dateKey);
    const day = getDayForDate(selectedDate);
    const backgroundColor = dateColors[dateKey] || viewerBg;

    return (
      <View style={[styles.eventViewer, { backgroundColor }]}>
        <View style={styles.eventViewerHeader}>
          <Text style={styles.eventViewerTitle}>EVENT VIEWER</Text>
        </View>
        <View style={styles.eventHeader}>
          <Text style={styles.eventHeaderDate}>
            {day}, {getOrdinalSuffix(selectedDate)}.
          </Text>
          <TouchableOpacity
            onPress={closeEventViewer}
            style={styles.closeButton}
          >
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.addEventButtons}>
          <TouchableOpacity
            onPress={addEventForSelectedDate}
            style={styles.actionButton}
          >
            <FontAwesome name="plus-square" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={addReminderForSelectedDate}
            style={styles.actionButton}
          >
            <FontAwesome name="bell" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.colorPickerWrapper}>
              <TouchableOpacity
                style={[styles.colorPreview, { backgroundColor }]}
                onPress={() => {
                  Alert.prompt(
                    "Choose Color",
                    "Enter a color hex code (e.g., #FF5733):",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "OK",
                        onPress: (color) => {
                          if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
                            updateEventViewerBackgroundColor(color);
                          } else if (color) {
                            Alert.alert(
                              "Invalid Color",
                              "Please use a valid hex color code",
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {moodForSelectedDate && (
          <Text style={styles.moodDisplay}>{moodForSelectedDate.mood}</Text>
        )}

        {eventsForSelectedDate.length === 0 ? (
          <Text style={styles.noEventsText}>No Events.</Text>
        ) : (
          eventsForSelectedDate.map((item, index) => (
            <View key={item.id} style={styles.eventItem}>
              <Text style={styles.eventName}>
                {index + 1}.{item.name}
                {item.eventDates && item.eventDates.length > 1 && (
                  <Text style={styles.eventDateRange}>
                    ({item.startDate} - {item.endDate})
                  </Text>
                )}
              </Text>
              <View style={styles.divider} />
              {item.description && (
                <Text style={styles.eventDetail}>
                  Description: {item.description}
                </Text>
              )}
              {item.time && (
                <Text style={styles.eventDetail}>Time: {item.time}</Text>
              )}
              {item.location && (
                <Text style={styles.eventDetail}>
                  Location: {item.location}
                </Text>
              )}
              <View style={styles.divider} />
              <View style={styles.eventActions}>
                <TouchableOpacity
                  onPress={() => handleEditEvent(item.id)}
                  style={styles.editButton}
                >
                  <FontAwesome name="pencil" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onEventDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <FontAwesome name="trash" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const addReminderForSelectedDate = () => {
    Alert.alert(
      "Reminder",
      "Push notification reminders will be available in the next update!",
    );
  };

  const YearView = () => {
    const monthsData = getAllMonthsForYear(yearViewYear);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const today = new Date();

    const handlePrevYear = () => setYearViewYear((prev) => prev - 1);
    const handleNextYear = () => setYearViewYear((prev) => prev + 1);
    const handleMonthClick = (monthIndex) => {
      setCurrentMonth(monthIndex);
      setCurrentYear(yearViewYear);
      setCalendarCurrentView("month");
      if (onViewChange) {
        onViewChange("month");
      }
    };

    const getYearBackgroundColor = () => {
      return isDarkTheme ? "#1a1a1a" : "#f5f5f5";
    };

    const getYearTextColor = () => {
      return isDarkTheme ? "#FFFFFF" : "#000033";
    };

    const getYearNavColor = () => {
      return isDarkTheme ? "#FFFFFF" : "#000033";
    };

    const getMonthCardTitleColor = () => {
      return isDarkTheme ? "#FFFFFF" : "#000033";
    };

    const getMonthDayHeaderColor = () => {
      return isDarkTheme ? "#FFFFFF" : "#000033";
    };

    const getMonthDateColor = (hasEvent, isToday, isSunday, date) => {
      if (isToday) return "#000033";
      if (hasEvent && isDarkTheme) {
        return "#1a3a1a";
      } else if (hasEvent) return "white";
      if (isSunday) return "red";
      return isDarkTheme ? "#FFFFFF" : "#000033";
    };

    const getMonthDateBackground = (hasEvent, isToday) => {
      if (isToday && hasEvent) return "#FF5722";
      if (hasEvent && isDarkTheme) {
        return "greenyellow";
      } else if (hasEvent) return "#38BDF8";
      if (isToday) return "gold";
      return "transparent";
    };

    return (
      <ScrollView
        style={[
          styles.yearView,
          { marginTop: -25, backgroundColor: getYearBackgroundColor() },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          barStyle={isDarkTheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkTheme ? "#1a1a1a" : "whitesmoke"}
          translucent={false}
        />
        <View style={styles.yearHeader}>
          <TouchableOpacity
            onPress={handlePrevYear}
            style={styles.yearNavButton}
          >
            <FontAwesome
              name="angle-double-left"
              size={22}
              color={getYearNavColor()}
            />
          </TouchableOpacity>
          <Text style={[styles.yearTitle, { color: getYearTextColor() }]}>
            {yearViewYear}
          </Text>
          <TouchableOpacity
            onPress={handleNextYear}
            style={styles.yearNavButton}
          >
            <FontAwesome
              name="angle-double-right"
              size={22}
              color={getYearNavColor()}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.monthsGrid}>
          {monthsData.map((month, idx) => (
            <TouchableOpacity key={idx} onPress={() => handleMonthClick(idx)}>
              <Text
                style={[
                  styles.monthCardTitle,
                  { color: getMonthCardTitleColor() },
                ]}
              >
                {monthNames[idx]}
              </Text>
              <View style={styles.monthDayHeaders}>
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.monthDayHeader,
                      { color: getMonthDayHeaderColor() },
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>
              {month.weeks.map((week, weekIdx) => (
                <View key={weekIdx} style={styles.monthWeek}>
                  {week.map((date, dateIdx) => {
                    const isToday =
                      yearViewYear === today.getFullYear() &&
                      idx === today.getMonth() &&
                      date === today.getDate();
                    const dateKey = `${yearViewYear}-${idx + 1}-${date}`;
                    const hasEvent = events.some((e) =>
                      e.dateKeys?.includes(dateKey),
                    );
                    const isSunday =
                      date && new Date(yearViewYear, idx, date).getDay() === 0;

                    return (
                      <Text
                        key={dateIdx}
                        style={[
                          styles.monthDate,
                          {
                            color: getMonthDateColor(
                              hasEvent,
                              isToday,
                              isSunday,
                              date,
                            ),
                            backgroundColor: getMonthDateBackground(
                              hasEvent,
                              isToday,
                            ),
                          },
                        ]}
                      >
                        {date || ""}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const weeks = getWeeks();
  const formatted = new Date(currentYear, currentMonth).toLocaleString(
    "default",
    {
      month: "long",
      year: "numeric",
    },
  );
  const today = new Date();
  const todayDate =
    today.getMonth() === currentMonth && today.getFullYear() === currentYear
      ? today.getDate()
      : null;

  const getContainerBackground = () => {
    return isDarkTheme ? "#1a1a1a" : "whitesmoke";
  };

  const getHeaderTitleColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getNavButtonColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getMonthTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getMoodTextColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getDayNameColor = () => {
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  const getDateTextColor = (hasEvent, isToday, isSunday) => {
    if (isToday && hasEvent) return "blue";
    if (isToday) return "gold";
    if (hasEvent && isDarkTheme) {
      return "greenyellow";
    } else if (hasEvent) return "#38BDF8";
    if (isSunday) return "red";
    return isDarkTheme ? "#FFFFFF" : "#000033";
  };

  if (calendarCurrentView === "year") {
    return <YearView />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: getContainerBackground() }]}
    >
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#1a1a1a" : "whitesmoke"}
        translucent={false}
      />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: getHeaderTitleColor() }]}>
          Calendar
        </Text>
      </View>

      <View style={styles.toggleButtons}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { borderColor: isDarkTheme ? "#3a3a3a" : "#000033" },
          ]}
          onPress={handleYearButtonClick}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: isDarkTheme ? "#FFFFFF" : "#000033" },
            ]}
          >
            Year View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { borderColor: isDarkTheme ? "#3a3a3a" : "#000033" },
          ]}
          onPress={handleMonthButtonClick}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: isDarkTheme ? "#FFFFFF" : "#000033" },
            ]}
          >
            Month View
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
            <FontAwesome
              name="angle-double-left"
              size={20}
              color={getNavButtonColor()}
            />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: getMonthTextColor() }]}>
            {formatted}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <FontAwesome
              name="angle-double-right"
              size={20}
              color={getNavButtonColor()}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleMood} style={styles.moodButton}>
          <Text style={[styles.moodText, { color: getMoodTextColor() }]}>
            {(() => {
              const today = new Date();
              const todayDateNum = today.getDate();
              const todayMonth = today.getMonth();
              const todayYear = today.getFullYear();
              if (todayMonth !== currentMonth || todayYear !== currentYear) {
                return "Navigate to current month to add mood";
              }
              const dateKey = `${todayYear}-${todayMonth + 1}-${todayDateNum}`;
              const todayMood = moods.find((m) => m.dateKey === dateKey);
              return todayMood?.mood || "Click to add thought of the day";
            })()}
          </Text>
        </TouchableOpacity>

        <View style={styles.dayNames}>
          {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day, i) => (
            <Text
              key={i}
              style={[styles.dayName, { color: getDayNameColor() }]}
            >
              {day}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((date, dateIndex) => {
              if (date === null) {
                return <View key={dateIndex} style={styles.emptyDate} />;
              }

              const hasEvent = hasEventsForDate(date);
              const isSunday =
                new Date(currentYear, currentMonth, date).getDay() === 0;
              const isToday = date === todayDate;
              const needsRightConn = needsConnectionToRight(date);

              return (
                <TouchableOpacity
                  key={dateIndex}
                  style={[
                    styles.dateCell,
                    hasEvent && styles.dateCellWithEvent,
                    isToday && styles.dateCellToday,
                    needsRightConn && styles.dateCellConnected,
                  ]}
                  onPress={() => updateEventViewer(date)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: getDateTextColor(hasEvent, isToday, isSunday),
                      },
                    ]}
                  >
                    {date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <EventViewer />

      {showEventEditor && (
        <EventEditor
          visible={showEventEditor}
          onClose={() => {
            setShowEventEditor(false);
            setEditingEvent(null);
          }}
          onSaveEvent={handleSaveEvent}
          editingEvent={editingEvent}
          isDarkTheme={isDarkTheme}
        />
      )}

      {deleteWarningActive && (
        <View style={styles.deleteWarningOverlay}>
          <View
            style={[
              styles.deleteWarningModal,
              isDarkTheme && styles.deleteWarningModalDark,
            ]}
          >
            <Text
              style={[
                styles.deleteWarningText,
                isDarkTheme && { color: "#FFFFFF" },
              ]}
            >
              Are you sure?
            </Text>
            <View style={styles.deleteWarningButtons}>
              <TouchableOpacity
                onPress={confirmDelete}
                style={styles.deleteWarningYes}
              >
                <Text style={styles.deleteWarningButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelDelete}
                style={styles.deleteWarningNo}
              >
                <Text style={styles.deleteWarningButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.calendarWarning}>
        <Text style={[styles.warningText, isDarkTheme && { color: "#6b7280" }]}>
          Click on dates to see or add events.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 22,
  },
  header: {
    marginTop: 5,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  toggleButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 14,
  },
  calendarContainer: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 12,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  moodButton: {
    alignItems: "center",
    marginBottom: 16,
  },
  moodText: {
    fontSize: 14,
  },
  dayNames: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dayName: {
    fontWeight: "bold",
    fontSize: 14,
    width: 40,
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  dateCell: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  emptyDate: {
    width: 40,
    height: 40,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventViewer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
  },
  eventViewerHeader: {
    marginBottom: 12,
  },
  eventViewerTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventHeaderDate: {
    color: "white",
    fontSize: 30,
  },
  closeButton: {
    padding: 8,
  },
  addEventButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  actionButton: {
    padding: 8,
  },
  colorPickerWrapper: {
    marginLeft: 8,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "white",
  },
  moodDisplay: {
    color: "greenyellow",
    fontSize: 15,
    textAlign: "center",
    marginVertical: 12,
  },
  noEventsText: {
    color: "white",
    textAlign: "center",
    marginTop: 30,
  },
  eventItem: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  eventName: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
  },
  eventDateRange: {
    fontSize: 18,
    color: "#ccc",
    marginLeft: 10,
  },
  divider: {
    borderBottomColor: "white",
    borderBottomWidth: 0.5,
    marginVertical: 10,
  },
  eventDetail: {
    color: "white",
    fontSize: 25,
    marginVertical: 5,
  },
  eventActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  yearView: {
    flex: 1,
    padding: 0,
  },
  yearHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginVertical: 20,
  },
  yearNavButton: {
    padding: 8,
  },
  yearTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 25,
  },
  monthCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  monthDayHeaders: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  monthDayHeader: {
    fontSize: 10,
    fontWeight: "bold",
    width: 14,
    textAlign: "center",
  },
  monthWeek: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 2,
  },
  monthDate: {
    fontSize: 8,
    width: 12,
    textAlign: "center",
    borderRadius: 62,
  },
  deleteWarningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  deleteWarningModal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteWarningModalDark: {
    backgroundColor: "#2a2a2a",
  },
  deleteWarningText: {
    fontSize: 18,
    marginBottom: 20,
  },
  deleteWarningButtons: {
    flexDirection: "row",
    gap: 20,
  },
  deleteWarningYes: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteWarningNo: {
    backgroundColor: "#F44336",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteWarningButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  calendarWarning: {
    marginTop: 35,
    alignItems: "center",
  },
  warningText: {
    color: "#666",
    fontSize: 12,
  },
});
