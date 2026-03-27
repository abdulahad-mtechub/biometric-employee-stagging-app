import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const LoanCard = ({title, date, amount, installment, onPress}) => {
  const {isDarkMode} = useSelector(store => store.theme);

  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const styles = dynamicStyles(isDarkMode, theme);

  return (
    <TouchableOpacity
      style={[styles.card, {}]}
      onPress={onPress ? onPress : () => {}}>
      <View style={styles.rowViewSB}>
        <Text style={[styles.title, {}]}>{title}</Text>
        <Text style={[styles.amountText, {}]}>${amount}</Text>
      </View>

      <View style={styles.rowViewSB}>
        <View style={styles.row}>
          {isDarkMode ? (
            <Svgs.calenderBlue />
          ) : (
            <Svgs.calenderL height={hp(2)} width={hp(2)} />
          )}

          <Text style={[styles.dateText, {}]}>{date}</Text>
        </View>
        <Text style={[styles.installmentText, {}]}>${installment}</Text>
      </View>
    </TouchableOpacity>
  );
};

const dynamicStyles = (isDarkMode, theme) =>
  StyleSheet.create({
    card: {
      padding: wp(3),
      borderRadius: wp(2.5),
      marginBottom: hp(1.5),
      borderWidth: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderColor: theme.BorderGrayColor,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      //   marginVertical: hp(0.5),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: theme.primaryTextColor,
    },
    dateText: {
      marginLeft: wp(1.5),
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#363333',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      //   marginTop: hp(0.8),
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(1.2),
    },
    amountText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsBold,
      color: theme.primaryTextColor,
    },
    installmentText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#363333',
    },
  });

export default LoanCard;
