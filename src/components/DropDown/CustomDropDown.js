import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
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

const CustomDropDown = ({
  data = [],
  selectedValue,
  backgroundColor,
  onValueChange,
  placeholder,
  containerStyle,
  width,
  astrik,
  marginTop,
  marginLeft,
  multiSelect = false,
  checkBox = false,
  selectedValues = [],
  onMultiChange,
  error,
  requireSearch = false, // New prop: if true, requires user to search before showing results
}) => {
  const [isFocus, setIsFocus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();

  const styles = dynamicStyles({isDarkMode, width, isFocus});

  const handleItemSelect = item => {
    if (multiSelect) {
      if (onMultiChange) {
        onMultiChange(item.value);
      }
    } else {
      if (onValueChange) {
        onValueChange(item.value);
      }
      setIsFocus(false);
    }
  };

  const normalizedData = Array.isArray(data)
    ? data
        .map(item => {
          if (typeof item === 'object' && item?.label && item?.value) {
            return item;
          }
          if (typeof item === 'object' && item?.name) {
            return {
              label: item.name,
              value: item.name,
              originalItem: item,
            };
          }
          return {
            label: typeof item === 'string' ? item : String(item),
            value: typeof item === 'string' ? item : String(item),
          };
        })
        .sort((a, b) => {
          const labelA = (a.label || '').toString().toLowerCase() || '';
          const labelB = (b.label || '').toString().toLowerCase() || '';
          return labelA.localeCompare(labelB);
        })
    : [];

  // Filter data based on search query
  const filteredData = searchQuery
    ? normalizedData.filter(item => {
        const label = item.label || '';
        return label
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      })
    : requireSearch
    ? [] // If requireSearch is true and no search query, show empty list
    : normalizedData; // Otherwise show all data

  // Determine if search should be enabled
  const enableSearch = normalizedData.length > 7 || requireSearch;

  // FIX: Ensure we always return a string, not an object
  const getDisplayValue = () => {
    if (multiSelect && selectedValues.length > 0) {
      const selectedItems = normalizedData.filter(item =>
        selectedValues.includes(item.value),
      );
      return selectedItems.map(item => item.label).join(', ');
    }

    if (!multiSelect) {
      // Handle case where selectedValue might be an object
      if (typeof selectedValue === 'object' && selectedValue !== null) {
        return selectedValue.label || String(selectedValue);
      }
      // Handle case where selectedValue is a string or number
      if (selectedValue) {
        // Find the corresponding label for the value
        const selectedItem = normalizedData.find(
          item => item.value === selectedValue,
        );
        return selectedItem ? selectedItem.label : String(selectedValue);
      }
    }

    // Return placeholder as fallback
    return t(placeholder) + (astrik ? ' *' : '');
  };

  const displayValue = getDisplayValue();

  // Check if item is selected
  const isItemSelected = itemValue => {
    if (multiSelect) {
      return selectedValues?.includes(itemValue);
    }

    if (typeof selectedValue === 'object' && selectedValue !== null) {
      return selectedValue.value === itemValue;
    }

    return selectedValue === itemValue;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Dropdown
        style={[styles.dropdown, {backgroundColor}]}
        containerStyle={[styles.dropdownListContainer, {marginTop, marginLeft}]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        itemTextStyle={styles.itemTextStyle}
        iconStyle={styles.iconStyle}
        data={filteredData}
        value={multiSelect ? null : selectedValue}
        labelField="label"
        valueField="value"
        placeholder={displayValue}
        fontFamily={Fonts.PoppinsRegular}
        search={enableSearch}
        searchPlaceholder={t('Search...')}
        inputSearchStyle={styles.inputSearchStyle}
        onChangeText={setSearchQuery}
        onFocus={() => setIsFocus(true)}
        onBlur={() => {
          setIsFocus(false);
          setSearchQuery('');
        }}
        onChange={handleItemSelect}
        renderItem={
          checkBox
            ? (item, selected) => {
                const selectedStatus = isItemSelected(item.value);

                return (
                  <View style={styles.dropdownItem}>
                    <Text
                      style={[
                        styles.itemText,
                        selectedStatus && styles.selectedItemText,
                      ]}>
                      {item.label}{' '}
                    </Text>
                    {selectedStatus ? (
                      <Svgs.checked height={hp(2.6)} />
                    ) : isDarkMode ? (
                      <Svgs.UncheckBoxD
                        height={hp(2.5)}
                        width={hp(2.5)}
                        style={{marginTop: hp(0.6)}}
                      />
                    ) : (
                      <Svgs.check
                        height={hp(2.5)}
                        width={hp(2.5)}
                        style={{marginTop: hp(0.6)}}
                      />
                    )}
                  </View>
                );
              }
            : undefined
        }
        mode="dropdown"
        renderRightIcon={() => (
          <View style={{paddingRight: wp(2)}}>
            <Svgs.dropDownArrow height={wp(4)} width={wp(4)} />
          </View>
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default CustomDropDown;

const dynamicStyles = ({isDarkMode, width, isFocus}) =>
  StyleSheet.create({
    container: {
      zIndex: 1000,
      marginBottom: hp(1.5),
    },
    dropdown: {
      height: hp(6),
      width: width || wp(90),
      borderColor: isFocus
        ? isDarkMode
          ? Colors.darkTheme.primaryColor
          : Colors.lightTheme.primaryColor
        : isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(2),
      paddingHorizontal: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    placeholderStyle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    selectedTextStyle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    itemTextStyle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    dropdownListContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      // marginTop: Platform.OS === 'ios' ? -hp(7) : null,
      // marginLeft: Platform.OS === 'ios' ? -wp(3.6) : null,
    },
    iconStyle: {
      width: wp(4),
      height: wp(4),
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(2),
    },
    itemText: {
      fontSize: RFPercentage(pxToPercentage(15)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginRight: wp(2),
    },
    selectedItemText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(15)),
    },
    inputSearchStyle: {
      height: hp(5),
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      backgroundColor: '#f9f9f9ff',
      // borderColor: isDarkMode
      //   ? Colors.darkTheme.BorderGrayColor
      //   : Colors.lightTheme.BorderGrayColor,
      // zIndex: 13000,
      borderRadius: wp(2),
      // overflow: 'hidden',
      borderWidth: 0,
    },
    errorBorder: {
      borderColor: Colors.error,
      borderWidth: 1,
    },
    errorText: {
      color: Colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });
