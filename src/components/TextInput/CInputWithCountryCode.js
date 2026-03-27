import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import CountryPickerBottomSheet from '../BottomSheets/CountryPickerBottomSheet';
import {useTranslation} from 'react-i18next';

const CInputWithCountryCode = ({
  phoneNo,
  setPhoneNo,
  setCountryCode,
  countryCode,
  placeholder,
  width,
  containerStyle,
  error,
  placeholderTextColor,
  selectedCountry,
  setSelectedCountry,
}) => {
  const countryPickerBtmSeetRef = useRef();
  const {isDarkMode} = useSelector(state => state.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View>
      <View
        style={[
          styles.container,
          containerStyle,
          {width: width},
          error && {
            borderColor: '#FF0000',
            backgroundColor: `${'#FF0000'}20`,
          },
        ]}>
        <TouchableOpacity
          style={styles.countryCodeButton}
          activeOpacity={0.7}
          onPress={() => countryPickerBtmSeetRef.current.open()}>
          {/* <CountryPicker
        show={countryPickerVisible}
        onBackdropPress={() => setCountryPickerVisible(false)}
        searchMessage="Sorry we can't find your country"
        style={{
          // Styles for whole modal [View]
          modal: {
              height: '70%',
              backgroundColor: isDarkMode? Colors.darkTheme.backgroundColor: Colors.lightTheme.backgroundColor
          },
          // Styles for modal backdrop [View]
          backdrop: {
          // backgroundColor: 'green'
          },
          // Styles for bottom input line [View]
          line: {
            backgroundColor: isDarkMode? Colors.darkTheme.BorderGrayColor: Colors.lightTheme.BorderGrayColor,
            marginVertical: hp(2),
          },
          // Styles for list of countries [FlatList]
          itemsList: {
          
          },
          // Styles for input [TextInput]
          textInput: {
            height: hp(7),
            // borderRadius: 10,
             color: isDarkMode? Colors.darkTheme.primaryTextColor: Colors.lightTheme.primaryTextColor,
             backgroundColor: isDarkMode? Colors.darkTheme.secondryColor: Colors.lightTheme.secondryColor,
             paddingHorizontal: wp(3),
             borderColor: isDarkMode? Colors.darkTheme.BorderGrayColor: Colors.lightTheme.BorderGrayColor,
                borderWidth: 0.5
            
          },
          // Styles for country button [TouchableOpacity]
          countryButtonStyles: {
                
                backgroundColor:isDarkMode? Colors.darkTheme.secondryColor: Colors.lightTheme.secondryColor,
                borderColor: isDarkMode? Colors.darkTheme.BorderGrayColor: Colors.lightTheme.BorderGrayColor,
                borderWidth: 0.5
          },
          // Styles for search message [Text]
          searchMessageText: {
  
          },
          
          // Styles for search message container [View]
          countryMessageContainer: {
          
          },
          // Flag styles [Text]
          flag: {
  
          },
          // Dial code styles [Text]
          dialCode: {
            color: isDarkMode? Colors.darkTheme.primaryTextColor: Colors.lightTheme.primaryTextColor,
          },
          // Country name styles [Text]
          countryName: {
            color: isDarkMode? Colors.darkTheme.primaryTextColor: Colors.lightTheme.primaryTextColor,
          },
      }}
        pickerButtonOnPress={(country) => {
            setCountryPickerVisible(false);
            const callingCode = country.dial_code || '0';
            setCountryCode(`${callingCode}`);
            // setCountryCodeISO(country.code);
            setFlag(country.flag)
            
          }}
      /> */}
          <Text style={styles.countryCodeText}>
            {selectedCountry?.flag} {selectedCountry?.dial_code}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={phoneNo}
          onChangeText={setPhoneNo}
          keyboardType="numeric"
          placeholderTextColor={
            placeholderTextColor || isDarkMode
              ? Colors.darkTheme.secondryTextColor
              : Colors.lightTheme.secondryTextColor
          }
        />
      </View>
      {error && (
        <Text
          style={{
            color: 'red',
            fontFamily: Fonts.RobotoRegular,
            fontSize: RFPercentage(1.5),
            marginTop: hp(0.5),
          }}>
          {typeof error === 'string' ? error : error}
        </Text>
      )}

      <CountryPickerBottomSheet
        refRBSheet={countryPickerBtmSeetRef}
        showSearch={true}
        heading={t('Select Country')}
        selectLocation={selectedCountry}
        setSelected={country => {
          setSelectedCountry(country);
          setCountryCode(country.dial_code);
        }}
      />
    </View>
  );
};

export default CInputWithCountryCode;
const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      width: '100%',
      alignSelf: 'center',
      marginBottom: hp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    countryCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: wp(2),
    },
    countryCodeText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.8),
      borderRightWidth: 1,
      borderRightColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      paddingRight: wp(2),
    },
    textInput: {
      flex: 1,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.8),
      paddingVertical: hp(0.5),
      paddingHorizontal: wp(2),
      width: '100%',
    },
  });
