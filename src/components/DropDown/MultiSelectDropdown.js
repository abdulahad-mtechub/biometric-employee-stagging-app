import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
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

const MultiSelectDropdown = ({
  data = [],
  selectedValue = [],
  onValueChange,
  placeholder,
  containerStyle,
  width,
  astrik,
  marginTop,
  marginLeft,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const buttonRef = React.useRef(null);
  const dropdownWidth = width || wp(90);
  const styles = dynamicStyles({
    isDarkMode,
    width: dropdownWidth,
    error,
  });

  const handleItemSelect = itemValue => {
    let newSelectedValues = [...(selectedValue || [])];

    if (newSelectedValues.includes(itemValue)) {
      newSelectedValues = newSelectedValues.filter(val => val !== itemValue);
    } else {
      newSelectedValues.push(itemValue);
    }

    onValueChange(newSelectedValues);
  };

  const getDisplayText = () => {
    if (!selectedValue || selectedValue.length === 0) {
      return t(placeholder) + (astrik ? ' *' : '');
    }

    if (selectedValue.length === 1) {
      const selectedItem = data.find(
        item =>
          (typeof item === 'object' ? item.value : item) === selectedValue[0],
      );
      return typeof selectedItem === 'object'
        ? selectedItem.label
        : selectedItem;
    }

    return `${selectedValue.length} selected`;
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <View ref={buttonRef} style={[styles.container, containerStyle]}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}>
          <Text style={styles.placeholderText} numberOfLines={1}>
            {getDisplayText()}
          </Text>
          <Svgs.dropDownArrow height={wp(4)} width={wp(4)} />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={isOpen}
        animationType="none"
        onRequestClose={handleClose}
        supportedOrientations={['portrait']}
        statusBarTranslucent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}>
          <View style={styles.dropdownContainer}>
            <View style={[styles.dropdownList, {marginTop, marginLeft}]}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}>
                {data?.map((item, index) => {
                  const itemValue =
                    typeof item === 'object' ? item.value : item;
                  const itemLabel =
                    typeof item === 'object' ? item.label : item;
                  const isSelected =
                    selectedValue && selectedValue.includes(itemValue);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.selectedDropdownItem,
                      ]}
                      onPress={() => {
                        handleItemSelect(itemValue);
                        handleClose();
                      }}>
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.selectedItemText,
                        ]}>
                        {t(itemLabel) || itemLabel}
                      </Text>
                      {isSelected ? (
                        <Svgs.checked height={hp(2.6)} />
                      ) : isDarkMode ? (
                        <Svgs.UncheckBoxD
                          height={hp(2.5)}
                          width={hp(2.5)}
                          style={{marginRight: 5}}
                        />
                      ) : (
                        <Svgs.check height={hp(2.5)} width={hp(2.5)} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
};

const dynamicStyles = ({isDarkMode, width, isOpen, error}) =>
  StyleSheet.create({
    container: {
      zIndex: 100000,
      marginBottom: hp(1.5),
    },
    dropdownButton: {
      height: hp(6),
      width: width,
      borderColor: error
        ? Colors.error
        : isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(2),
      paddingLeft: wp(3),
      paddingRight: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    placeholderText: {
      fontSize: RFPercentage(pxToPercentage(15)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
    },
    dropdownContainer: {
      position: 'absolute',
      top: hp(28),
      left: 30,
      right: 30,
      bottom: 0,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: hp(20),
    },
    dropdownList: {
      width: width - wp(10),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      maxHeight: hp(50),
      zIndex: 100002,
    },
    scrollView: {
      maxHeight: hp(50),
    },
    scrollViewContent: {
      paddingVertical: hp(0.5),
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(3),
      width: '100%',
    },
    selectedDropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(3),
      width: '100%',
      backgroundColor: '#FFF',
    },
    itemText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginRight: wp(2),
      flex: 1,
    },
    selectedItemText: {
      color: isDarkMode ? Colors.lightTheme.primaryTextColor : '#000',
    },
    errorText: {
      color: Colors.error,
      fontSize: RFPercentage(1.5),
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.5),
      marginLeft: wp(1),
    },
  });

export default MultiSelectDropdown;
