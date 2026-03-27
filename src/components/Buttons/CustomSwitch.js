import React, {useEffect, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {heightPercentageToDP as hp} from 'react-native-responsive-screen';
const CustomSwitch = ({value, onValueChange}) => {
  const theme =
    useSelector(store => {
      try {
        return store?.theme || {};
      } catch (error) {
        return {};
      }
    }) || {};

  const isDarkMode = theme?.isDarkMode || false;
  const [switchValue, setSwitchValue] = useState(value === true);

  useEffect(() => {
    setSwitchValue(value === true);
  }, [value]);

  const handleToggle = () => {
    const newValue = !switchValue;
    setSwitchValue(newValue);
    if (onValueChange && typeof onValueChange === 'function') {
      onValueChange(newValue);
    }
  };

  const getColors = () => {
    const darkTheme = Colors?.darkTheme || {};
    const lightTheme = Colors?.lightTheme || {};

    return {
      activeBg: isDarkMode
        ? darkTheme.primaryColor || '#007AFF'
        : lightTheme.primaryColor || '#007AFF',
      inactiveBg: isDarkMode ? darkTheme.BorderGrayColor || '#555' : '#E2E2E2',
      activeThumb: isDarkMode
        ? darkTheme.secondryColor || '#FFF'
        : lightTheme.secondryColor || '#FFF',
      inactiveThumb: isDarkMode ? darkTheme.iconColor || '#777' : '#BEBEBE',
    };
  };

  const colors = getColors();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleToggle}
      style={[
        styles.switchContainer,
        {
          backgroundColor: switchValue ? colors.activeBg : colors.inactiveBg,
        },
      ]}>
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: switchValue
              ? colors.activeThumb
              : colors.inactiveThumb,
            marginLeft: switchValue ? 15 : 2,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    width: hp(4.8),
    height: hp(3),
    borderRadius: 12,
    justifyContent: 'center',
    // paddingHorizontal: 2,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default CustomSwitch;
