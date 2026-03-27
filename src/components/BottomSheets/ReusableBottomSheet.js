import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../utils/responsive';

const ReusableBottomSheet = ({
  refRBSheet,
  height,
  bgColor,
  sheetTitle = 'Select An Option',
  iconContainerStyle,
  options = [],
}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();

  const backgroundColor = bgColor
    ? bgColor
    : isDarkMode
    ? Colors.darkTheme.backgroundColor
    : Colors.lightTheme.backgroundColor;

  const styles = dynamicStyles(isDarkMode);

  return (
    <RBSheet
      ref={refRBSheet}
      height={height ? height : hp('35%')}
      openDuration={300}
      draggable={false}
      closeOnPressMask={true}
      customStyles={{
        container: {
          borderTopLeftRadius: wp('6%'),
          borderTopRightRadius: wp('6%'),
          backgroundColor: backgroundColor,
          paddingHorizontal: wp('5%'),
          paddingTop: hp('2%'),
        },
      }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{sheetTitle}</Text>
          <TouchableOpacity onPress={() => refRBSheet.current.close()}>
            <Icon
              name="x"
              size={RFPercentage(3)}
              color={
                isDarkMode
                  ? Colors.darkTheme.secondryTextColor
                  : Colors.lightTheme.secondryTextColor
              }
            />
          </TouchableOpacity>
        </View>

        {/* Option Items */}
        {options.map((option, index) => {
          const firstLetter = option?.title?.charAt(0)?.toUpperCase() || '?';
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionContainer,
                index === 0 && {borderTopWidth: 0},
              ]}
              onPress={option.onPress}>
              <View style={[styles.icon, iconContainerStyle]}>
                {option.icon ? (
                  option.icon
                ) : (
                  <Text style={styles.fallbackIcon}>{firstLetter}</Text>
                )}
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                {option.description && (
                  <Text style={styles.optionDesc}>{option.description}</Text>
                )}
              </View>
              <Icon
                name="chevron-right"
                size={RFPercentage(3)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor
                }
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </RBSheet>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp('1%'),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(22)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp('2%'),
      borderTopWidth: 0.5,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      minHeight: hp('7%'),
    },
    icon: {
      width: wp('10%'),
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp('6.5%'),
      paddingVertical: hp('1%'),
      borderRadius: wp(100),
    },
    fallbackIcon: {
      fontSize: RFPercentage(2.4),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    textWrapper: {
      flex: 1,
      marginLeft: wp('4%'),
    },
    optionTitle: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    optionDesc: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp('0.2%'),
      fontFamily: Fonts.PoppinsRegular,
    },
  });

export default ReusableBottomSheet;
