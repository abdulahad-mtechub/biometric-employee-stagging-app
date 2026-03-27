import React from 'react';
import {FlatList, Text, TouchableOpacity, StyleSheet, View} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';

const MultiSelectButtonList = ({
  options = [],
  selectedOptions = [],
  setSelectedOptions,
  isHorizontal = true,
  onPress, // Optional custom handler
  style = {},
}) => {
  const styles = dynamicStyles();

  const handleItemPress = item => {
    if (typeof onPress === 'function') {
      onPress(item, selectedOptions, setSelectedOptions); // Custom logic from parent
    } else {
      if (Array.isArray(selectedOptions)) {
        setSelectedOptions(prev => [...prev, item]);
      } else if (typeof selectedOptions === 'string') {
        setSelectedOptions(item);
      }
    }
  };

  const renderItem = ({item}) => {
    let isSelected;
    if (Array.isArray(selectedOptions)) {
      isSelected = selectedOptions.includes(item);
    } else if (typeof selectedOptions === 'string') {
      isSelected = selectedOptions === item;
    }

    return (
      <TouchableOpacity
        style={[
          styles.optionBtn,
          isSelected && styles.selectedBtn,
          style.button,
        ]}
        onPress={() => handleItemPress(item)}>
        <Text
          style={[
            styles.optionText,
            isSelected && styles.selectedText,
            style.text,
          ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <FlatList
        data={options}
        horizontal={isHorizontal}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item}
        renderItem={renderItem}
        contentContainerStyle={[{paddingVertical: hp(1)}]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default MultiSelectButtonList;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    optionBtn: {
      borderWidth: 1,
      borderColor: Colors.darkTheme.iconColor,
      borderRadius: wp(100),
      paddingHorizontal: wp(4),
      justifyContent: 'center',
      height: hp(4),
    },
    selectedBtn: {
      backgroundColor: `${Colors.darkTheme.primaryColor}`,
      borderColor: Colors.darkTheme.primaryColor,
      // borderRadius: wp(100),
    },
    optionText: {
      fontFamily: Fonts.Regular,
      fontSize: RFPercentage(1.8),
      color: Colors.darkTheme.primaryTextColor,
    },
    selectedText: {
      color: Colors.darkTheme.primaryTextColor,
      fontFamily: Fonts.SemiBold,
      letterSpacing: 1,
    },
    separator: {
      width: wp(2),
    },
  });
