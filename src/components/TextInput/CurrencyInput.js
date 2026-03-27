import React, {useState} from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';

const CurrencyInput = ({
  value,
  onChangeValue,
  selectedCurrency,
  onSelectCurrency,
  currencies,
}) => {
  const [dropdownValue, setDropdownValue] = useState(selectedCurrency.label);
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Currency Symbol */}
      <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>

      {/* Input Field */}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeValue}
        placeholder="0"
        placeholderTextColor="#999"
      />

      {/* Dropdown */}
      <View style={{width: 100}}>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          iconStyle={styles.iconStyle}
          data={currencies.map(item => ({
            label: item.label,
            value: item.label,
          }))}
          maxHeight={150}
          labelField="label"
          valueField="value"
          placeholder=""
          value={dropdownValue}
          onChange={item => {
            setDropdownValue(item.value);
            const selected = currencies.find(c => c.label === item.value);
            onSelectCurrency(selected.label);
          }}
        />
      </View>
    </View>
  );
};

export default CurrencyInput;
const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#ddd',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      height: 50,
      backgroundColor: isDarkMode ? Colors.darkTheme.input : '#fff',
      justifyContent: 'space-between',
    },
    currencySymbol: {
      marginRight: 10,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    dropdown: {
      height: 40,
      borderColor: 'transparent',
      borderWidth: 0,
      paddingHorizontal: 12,
      backgroundColor: 'transparent',
    },
    placeholderStyle: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    selectedTextStyle: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
  });
