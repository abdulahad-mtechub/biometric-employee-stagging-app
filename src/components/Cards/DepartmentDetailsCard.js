import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import { useTranslation } from 'react-i18next';

const DepartmentDetailsCard = ({department}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Department Details")}</Text>
        <Row
          label={"Full Name"}
          value={department.fullName}
          isDarkMode={isDarkMode}
        />
        <Row label={"ID"} value={department.id} isDarkMode={isDarkMode} />
        <View style={[styles.row, {marginVertical: 0}]}>
          <Text style={styles.label}>{'Head of Department'}</Text>

          <View style={[styles.row, {marginVertical: 0}]}>
            <Image source={department?.image} style={styles.image} />

            <Text style={styles.value}>{department.HOD}</Text>
          </View>
        </View>
        <Row
          label="Members"
          value={department.Members}
          isDarkMode={isDarkMode}
        />
        <Row
          label="Projects"
          value={department.Projects}
          isDarkMode={isDarkMode}
        />
        <Row
          label="Tasks"
          value={department.Tasks}
          isDarkMode={isDarkMode}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Address')}</Text>
        <Row
          label="Country"
          value={department.country}
          isDarkMode={isDarkMode}
        />
        <Row
          label="Province"
          value={department.province}
          isDarkMode={isDarkMode}
        />
        <Row label="City" value={department.city} isDarkMode={isDarkMode} />
        <Row
          label="Postal Code"
          value={department.postalCode}
          isDarkMode={isDarkMode}
        />
        <Row
          label="Street Address"
          value={department.street}
          isDarkMode={isDarkMode}
        />
      </View>
    </View>
  );
};

const Row = ({label, value, isDarkMode}) => {
  const styles = rowStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{t(label)}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(2),
      padding: wp(3),
      marginHorizontal: wp(4),
      marginVertical: wp(1.5),
    },
  
    section: {
      marginTop: hp(1),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: hp(0.3),
      alignItems: 'center'
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    image: {
      width: wp(6),
      height: hp(3),
      borderRadius: 100,
      marginRight: wp(2),
    },
  });

const rowStyles = isDarkMode =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: hp(0.3),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });

export default DepartmentDetailsCard;
