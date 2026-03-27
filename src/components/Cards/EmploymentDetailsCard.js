import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useTranslation} from 'react-i18next';

const EmploymentDetailsCard = ({data}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = createStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('Employment Details')}</Text>

      {[
        [t('Employee ID'), data.workingId],
        [t('Department'), data.department],
        [t('Designation'), data.designation],
        [t('Employment Type'), data.employmentType],
        [t('Salary'), data.salary],
        [t('Hiring Date'), data.hiringDate],
        [t('Shift Schedule'), data.shift],
      ].map(([label, value]) => (
        <Row key={label} label={label} value={value} isDarkMode={isDarkMode} />
      ))}

      <Text style={styles.sectionTitle}>{t('Assigned Zone / Region')}</Text>

      <Row
        label={t('Zone')}
        valueComponent={<Tags tags={data.zones} isDarkMode={isDarkMode} />}
      />
      <Row
        label={t('Countries')}
        valueComponent={<Tags tags={data.countries} isDarkMode={isDarkMode} />}
      />
      <Row
        label={t('Cities')}
        valueComponent={<Tags tags={data.cities} />}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const Row = ({label, value, valueComponent, isDarkMode}) => {
  const styles = rowStyles(isDarkMode);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {valueComponent ? (
        <View style={styles.value}>{valueComponent}</View>
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );
};

const Tags = ({tags, isDarkMode}) => {
  const styles = tagStyles(isDarkMode);
  return (
    <View style={styles.container}>
      {tags.map((tag, index) => (
        <View style={styles.tag} key={index}>
          <Text style={styles.tagText}>{tag} ╳</Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = isDarkMode =>
  StyleSheet.create({
    card: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(2),
      padding: wp(3),
      marginVertical: wp(1.5),
      marginHorizontal: wp(4),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsBold,
      fontSize: RFPercentage(2),
      marginVertical: hp(1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });

const rowStyles = isDarkMode =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginVertical: hp(0.3),
      flexWrap: 'wrap',
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,

      //   width: "40%",
    },
    valueText: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    value: {
      width: '67%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
  });

const tagStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',

      // gap: wp(1.5),
    },
    tag: {
      backgroundColor: isDarkMode ? Colors.darkTheme.primaryColor : '#579DFF',
      borderRadius: wp(1),
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(1),
      margin: wp(0.5),
    },
    tagText: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.6),
      color: Colors.darkTheme.primaryTextColor,
    },
  });

export default EmploymentDetailsCard;
