import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {Fonts} from '../Constants/Fonts';
import {Colors} from '../Constants/themeColors';

const NumericStepper = ({
  value,
  setValue,
  min = 0,
  max = 100,
  containerStyle,
  inputStyle,
  unitLabel,
}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const [inputText, setInputText] = useState(value.toString());

  const increment = () => {
    if (value < max) {
      const newValue = value + 1;
      setValue(newValue);
      setInputText(newValue.toString());
    }
  };

  const decrement = () => {
    if (value > min) {
      const newValue = value - 1;
      setValue(newValue);
      setInputText(newValue.toString());
    }
  };

  const handleTextChange = (text) => {
    // Prevent negative sign at the beginning
    if (text.startsWith('-')) {
      return;
    }

    setInputText(text);
    // Only update if the text is a valid number
    if (text === '') {
      setValue(0);
    } else {
      const numValue = parseInt(text);
      if (!isNaN(numValue)) {
        // Clamp value to min/max bounds
        const clampedValue = Math.max(min, Math.min(max, numValue));
        setValue(clampedValue);
      }
    }
  };

  const handleBlur = () => {
    // Ensure value is within bounds when user finishes typing
    let numValue = parseInt(inputText);
    if (isNaN(numValue)) numValue = min;
    numValue = Math.max(min, Math.min(max, numValue));
    setValue(numValue);
    setInputText(numValue.toString());
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.valueText, inputStyle]}
          value={inputText}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          selectTextOnFocus
          maxLength={3}
        />
        {unitLabel && <Text style={styles.unitLabel}>{unitLabel}</Text>}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={increment} disabled={value >= max}>
          <MaterialIcons
            name="keyboard-arrow-up"
            size={RFPercentage(2.8)}
            color={value >= max ? styles.arrowDisabledColor.color : styles.arrowColor.color}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={decrement} disabled={value <= min}>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={RFPercentage(2.8)}
            color={value <= min ? styles.arrowDisabledColor.color : styles.arrowColor.color}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NumericStepper;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(0.1),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : 'transparent',
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    valueText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      minWidth: wp(10),
    },
    unitLabel: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginLeft: wp(1),
    },
    buttonContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    arrowColor: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    arrowDisabledColor: {
      color: isDarkMode
        ? Colors.darkTheme.disabledColor
        : Colors.lightTheme.disabledColor,
    },
  });
