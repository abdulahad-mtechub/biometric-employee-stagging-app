// screens/NotificationPreferencesScreen.js
import React, {useState} from 'react';
import {ScrollView, StyleSheet, View, Text} from 'react-native';
import {useSelector} from 'react-redux';
import StackHeader from '../../../components/Header/StackHeader';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Colors} from '../../../Constants/themeColors';
import {Fonts} from '../../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import LabeledSwitch from '../../../components/Buttons/LabeledSwitch';
import { pxToPercentage } from '../../../utils/responsive';

const NotificationPreferencesScreen = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // === STATES ===
  const stateMap = {
    // Messages
    newGroupMsg: useState(false),
    directMsg: useState(false),
    mentionInGroup: useState(false),

    // Attendance
    clockInMethodChange: useState(false),
    shiftChange: useState(true),
    validPunch: useState(true),
    invalidPunch: useState(false),
    assignedZoneChange: useState(true),
    manualPunchChange: useState(true),

    // Task
    newTask: useState(false),
    overdueTask: useState(true),
    deadlineReminder: useState(true),
    mentionInComment: useState(false),
    docUpdated: useState(true),

    // Payments
    expenseApproved: useState(false),
    salaryTransfer: useState(true),
    loanApproved: useState(true),
    loanReminder: useState(false),
    remainingLoan: useState(false),

    // Request
    reqStatus: useState(false),
    reqRejected: useState(true),
    reqApproved: useState(true),

    // Document
    docDownloaded: useState(false),
    policyUpdated: useState(true),
    newPolicy: useState(true),

    // Other
    profileUpdated: useState(false),
    addedToDept: useState(true),
    addedToTeam: useState(true),
    promoted: useState(false),
  };

  const getSwitch = (label, stateKey) => {
    const [value, setter] = stateMap[stateKey];
    return {
      label: t(label),
      value,
      onToggle: () => setter(!value),
    };
  };

  const sections = [
    {
      title: t('Messages'),
      data: [
        getSwitch('New Message in Group', 'newGroupMsg'),
        getSwitch('Direct Message', 'directMsg'),
        getSwitch('Mentioning in Group', 'mentionInGroup'),
      ],
    },
    {
      title: t('Attendance'),
      data: [
        getSwitch('Clock-in Method Changes', 'clockInMethodChange'),
        getSwitch('Shift Changes', 'shiftChange'),
        getSwitch('Valid Punches', 'validPunch'),
        getSwitch('Invalid Punches', 'invalidPunch'),
        getSwitch('Assigned Zone/Region Changes', 'assignedZoneChange'),
        getSwitch('Manual Punch Status Changes', 'manualPunchChange'),
      ],
    },
    {
      title: t('Task'),
      data: [
        getSwitch('New Task Assigned', 'newTask'),
        getSwitch('Overdue Tasks', 'overdueTask'),
        getSwitch('Deadline Reminders', 'deadlineReminder'),
        getSwitch('Mentioning In Comments', 'mentionInComment'),
        getSwitch('Document updated/uploaded in task', 'docUpdated'),
      ],
    },
    {
      title: t('Payments'),
      data: [
        getSwitch('Expense Approved', 'expenseApproved'),
        getSwitch('Salary Transfer', 'salaryTransfer'),
        getSwitch('Loan Approved', 'loanApproved'),
        getSwitch('Loan Instalment Reminders', 'loanReminder'),
        getSwitch('Remaining Loan Amount', 'remainingLoan'),
      ],
    },
    {
      title: t('Request'),
      data: [
        getSwitch('Request Status Updated', 'reqStatus'),
        getSwitch('Request Rejected', 'reqRejected'),
        getSwitch('Request Approved', 'reqApproved'),
      ],
    },
    {
      title: t('Document'),
      data: [
        getSwitch('When Someone Download my Document', 'docDownloaded'),
        getSwitch('Company Policy Updated', 'policyUpdated'),
        getSwitch('Company New policy', 'newPolicy'),
      ],
    },
    {
      title: t('Other Notifications'),
      data: [
        getSwitch('Profile Updated', 'profileUpdated'),
        getSwitch('Added to New Department', 'addedToDept'),
        getSwitch('Added to New Team', 'addedToTeam'),
        getSwitch('Promoted to Team Lead/ Department Head', 'promoted'),
      ],
    },
  ];

  const NotificationSection = ({title, data}) => (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContainer}>
        {data.map((item, index) => (
          <LabeledSwitch
            key={index}
            title={item.label}
            value={item.value}
            onValueChange={item.onToggle}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Notification Preferences')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.5),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{paddingVertical: hp(2), backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : Colors.lightTheme.backgroundColor}}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: hp(5)}}>
        {sections.map((section, index) => (
          <NotificationSection
            key={index}
            title={section.title}
            data={section.data}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default NotificationPreferencesScreen;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      marginTop: 10,
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(1),
    },
    sectionContainer: {
      marginBottom: hp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 12,
      paddingHorizontal: wp(2),
      paddingVertical: hp(2),
    },
  });
