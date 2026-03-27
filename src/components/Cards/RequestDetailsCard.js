import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Images} from '../../assets/Images/Images';
import {useTranslation} from 'react-i18next';
import { pxToPercentage } from '../../utils/responsive';

const RequestDetailsCard = ({details, showFrom, heading, onPathPress, showChevron =true}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.valueContainer}>
        {Array.isArray(value) ? (
          value.map((line, index) => (
            <Text key={index} style={styles.value}>
              {line}
            </Text>
          ))
        ) : (
          label === "Path" ? (
            <TouchableOpacity onPress={() => {onPathPress && onPathPress(value)}} >
              <Text style={[styles.value, {color: Colors.lightTheme.primaryColor}]}>{value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.value}>{value}</Text>
          )
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      <View style={styles.rowViewSb}>
        <Text style={styles.title}>{t(heading)}</Text>

       {showChevron && <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />}
      </View>
      {showFrom && (
        <View style={[styles.row]}>
          <Text style={styles.label}>{t('From')}</Text>
          <View
            style={[styles.valueContainer, {flexDirection: 'row', flex: 0.9}]}>
            <Image source={Images.artist1} style={styles.profileImage} />
            <Text style={styles.value}>{'Brooklyn Simmons'}</Text>
          </View>
        </View>
      )}

      {details.map((item, index) => (
        <Row key={index} label={t(item.label)} value={item.value} />
      ))}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      margin: wp(4),
    },
    title: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlignVertical: 'center',
      //   marginBottom: hp(2),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    valueContainer: {
      flex: 1.2,
      alignItems: 'flex-end',
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
    },
    rowViewSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.2),
    },
    profileImage: {
      width: wp(5),
      height: wp(5),
      borderRadius: wp(5),
      marginRight: wp(2),
    },
  });

export default RequestDetailsCard;
