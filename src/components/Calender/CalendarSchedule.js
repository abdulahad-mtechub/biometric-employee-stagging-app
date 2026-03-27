import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const { width } = Dimensions.get("window");
const days = ["Mo", "Tu", "We", "Th", "Fri", "Sa", "Su"];
const dates = [29, 30, 31, 1, 2, 3, 4];

const tasks = [
  { title: "Task #1", color: "#FFA76D", start: 1, end: 5 },
  { title: "Task #5", color: "#FBD44A", start: 1, end: 5 },
  { title: "Task #3", color: "#3DDC97", start: 1, end: 5 },
  { title: "Task #", color: "#B59EFF", start: 5, end: 7 },
  { title: "Task #", color: "#3DDC97", start: 1, end: 6 },
  { title: "T 2", color: "#69A7FF", start: 3, end: 6 },
];

const CalendarScreen = () => {
  return (
    <View  style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {days.map((day, index) => (
          <View key={index} style={styles.dayContainer}>
            <Text style={styles.dayText}>{day}</Text>
            <View style={[styles.dateCircle, index === 3 && styles.selectedDate]}>
              <Text style={styles.dateText}>{dates[index]}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Time slots + Tasks */}
      <ScrollView horizontal style={styles.bodyContainer}>
        <View style={styles.timeGrid}>
          {[...Array(7)].map((_, hour) => (
            <View key={hour} style={styles.timeRow}>
              <Text style={styles.timeLabel}>{hour + 1} AM</Text>
              <View style={styles.timeSlotsRow}>
                {[...Array(7)].map((_, col) => (
                  <View key={col} style={styles.timeSlot}></View>
                ))}
              </View>
            </View>
          ))}

          {/* Task Overlays */}
          {tasks.map((task, index) => (
            <View
              key={index}
              style={[
                styles.taskBox,
                {
                  backgroundColor: task.color,
                  top: hp(task.start * 5),
                  height: hp((task.end - task.start) * 5),
                  left: wp(13 + index * 13),
                },
              ]}
            >
              <Text style={styles.taskText}>{task.title}</Text>
            </View>
          ))}

          {/* Plus Button (Blue box) */}
          <View style={styles.plusBox}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: wp(3),
    backgroundColor: "#fff",
  },
  dayContainer: {
    alignItems: "center",
    width: wp(12),
  },
  dayText: {
    fontSize: RFPercentage(1.8),
    color: "#333",
  },
  dateCircle: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  selectedDate: {
    backgroundColor: "#007AFF",
  },
  dateText: {
    color: "#fff",
    fontWeight: "bold",
  },
  bodyContainer: {
    marginTop: hp(1),
  },
  timeGrid: {
    marginHorizontal: wp(3),
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  timeLabel: {
    width: wp(12),
    fontSize: RFPercentage(1.6),
    color: "#888",
  },
  timeSlotsRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  timeSlot: {
    width: wp(10),
    height: hp(5),
    backgroundColor: "#F0F0F0",
    marginHorizontal: 1,
    borderRadius: 4,
  },
  taskBox: {
    position: "absolute",
    width: wp(11),
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  taskText: {
    color: "#000",
    fontWeight: "bold",
    writingDirection: "ltr",
    textAlign: "center",
  },
  plusBox: {
    position: "absolute",
    backgroundColor: "#007AFF",
    width: wp(10),
    height: hp(5),
    top: hp(15),
    left: wp(40),
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: "#fff",
    fontSize: RFPercentage(2.5),
  },
});

export default CalendarScreen;
