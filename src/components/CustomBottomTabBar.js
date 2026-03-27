import React, {useEffect} from 'react';
import {View, TouchableOpacity, StyleSheet, Text, Platform} from 'react-native';
import {Colors} from '../Constants/themeColors';
import {Fonts} from '../Constants/Fonts';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import {SCREENS} from '../Constants/Screens';
import {useTranslation} from 'react-i18next';
import {useButtonColors} from '../Constants/colorHelper';
import {widthPercentageToDP as wp} from 'react-native-responsive-screen';
import DynamicIcon from './DynamicIcon/DynamicIcon';

const CustomBottomTabBar = ({
  state,
  descriptors,
  navigation,
  icons,
  FocusedIcons,
}) => {
  const {routes} = state;
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  // Message badge moved to header - removed from bottom tabs

  return (
    <View style={[styles.tabContainer]}>
      {routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const iconConfig = isFocused ? FocusedIcons[index] : icons[index];
        const iconColor = isFocused
          ? primaryButtonColors.backgroundColor
          : isDarkMode
          ? Colors.darkTheme.secondryTextColor
          : Colors.lightTheme.secondryTextColor;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tabButton]}>
            <View
              style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
              <View style={{position: 'relative'}}>
                <DynamicIcon
                  family={iconConfig.family}
                  name={iconConfig.name}
                  size={wp(6.5)}
                  color={iconColor}
                />
              </View>

              <Text
                style={[
                  styles.tabText,
                  isFocused && {
                    color: primaryButtonColors.backgroundColor,
                    fontFamily: Fonts.PoppinsSemiBold,
                  },
                ]}>
                {t(label)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomBottomTabBar;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      height: Platform.OS === 'ios' ? 80 : 60,
      paddingBottom: Platform.OS === 'ios' ? 15 : 0,
    },
    tabButton: {
      borderRadius: 30,
      paddingHorizontal: 10,
      height: 40,
      justifyContent: 'center',
    },
    tabText: {
      textAlign: 'center',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.5),
      marginTop: heightPercentageToDP(0.5),
      letterSpacing: 0.5,
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -12,
      backgroundColor: Colors.lightTheme.primaryColor,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgePending: {
      position: 'absolute',
      top: -6,
      right: -12,
      backgroundColor: '#999999',
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: RFPercentage(1.1),
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });
