import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TxtInput from '../../../../components/TextInput/Txtinput';
import {useSelector} from 'react-redux';
import CustomButton from '../../../../components/Buttons/customButton';
import {Svgs} from '../../../../assets/Svgs/Svgs';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../../../Constants/themeColors';
import {Fonts} from '../../../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../../../utils/responsive';

const Step2 = () => {
  const {isDarkMode} = useSelector(store => store.theme);

  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const TimeInput = ({placeholder, isDarkMode}) => {
    const {t} = useTranslation();

    return (
      <View style={[styles.input]}>
        <Text style={styles.dateText}>{t(placeholder)}</Text>
        <View style={styles.iconRight}>{<Svgs.ClockL height={wp(6)} />}</View>
      </View>
    );
  };

  const Label = ({text, required, isDarkMode}) => {
    const {t} = useTranslation();

    return (
      <Text style={[styles.label]}>
        {t(text)}
        {required && <Text style={{color: 'red'}}> *</Text>}
      </Text>
    );
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <View style={styles.contentContainer}> */}
      <Text
        style={[
          styles.heading,
          {marginBottom: hp(2)}
        ]}>
        {t('Punch Details')}
      </Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <Label text="Clock-In" required isDarkMode={isDarkMode} />
          <TimeInput placeholder="Clock-In" isDarkMode={isDarkMode} />
        </View>
        <View style={styles.half}>
          <Label text="Clock-Out" required isDarkMode={isDarkMode} />
          <TimeInput placeholder="Clock-Out" isDarkMode={isDarkMode} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Label text="Break Start" required isDarkMode={isDarkMode} />
          <TimeInput placeholder="Starting Time" isDarkMode={isDarkMode} />
        </View>
        <View style={styles.half}>
          <Label text="Break End" required isDarkMode={isDarkMode} />
          <TimeInput placeholder="Ending Time" isDarkMode={isDarkMode} />
        </View>
      </View>

      <View style={styles.headerContainer}>
        <Text
          style={[
            styles.heading,
          ]}>
          {t('Location Details')}
        </Text>
      </View>
      <View style={{flex: 1, marginTop: hp(2)}}>
        <View style={styles.countrySelector}>
          <Text style={[styles.label, {marginBottom: 0, width: '30%'}]}>
            {t('Country')}
          </Text>
          <MaterialCommunityIcons
            name={'chevron-right'}
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.secondryTextColor
                : Colors.lightTheme.iconColor
            }
          />
        </View>
        <Text style={styles.label}>{t('Community/Proviance(Optional)')}</Text>
        <TxtInput
          value={state}
          containerStyle={styles.inputField}
          placeholder="Add your Community/Proviance"
          onChangeText={setState}
        />
        <Text style={styles.label}>
          {t('City')} <Text style={{color: 'red'}}>*</Text>
        </Text>
        <TxtInput
          value={city}
          containerStyle={styles.inputField}
          placeholder="Add your city"
          onChangeText={setCity}
        />

        <Text style={styles.label}>
          {t('Postal Code')} <Text style={{color: 'red'}}>*</Text>
        </Text>
        <TxtInput
          value={postalCode}
          containerStyle={styles.inputField}
          placeholder="Add your postal code"
          onChangeText={setPostalCode}
        />
        <Text style={styles.label}>{t('Street Address (Optional)')}</Text>
        <View style={styles.addressContainer}>
          <TxtInput
            value={address}
            containerStyle={[styles.inputField, {marginBottom: hp(0)}]}
            placeholder="Add street, office address"
            onChangeText={setAddress}
            style={{flex: 0.7}}
          />
          <CustomButton
            containerStyle={styles.mapBtn}
            text="Map"
            textStyle={styles.mapBtnText}
            svg={<Svgs.MapIcon />}
          />
        </View>
      </View>

      {/* </View> */}
    </ScrollView>
  );
};

export default Step2;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'left',
    },
    countrySelector: {
      flexDirection: 'row',
      paddingHorizontal: wp('4%'),
      paddingVertical: wp('2.5%'),
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(3),
      marginBottom: hp(2),
      justifyContent: 'space-between',
      overflow: 'hidden',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      width: wp(80),
      marginBottom: hp(0.5),
    },
    inputField: {
      borderRadius: wp(3),
      marginBottom: hp(2),
      backgroundColor: isDarkMode ? Colors.darkTheme.input : 'transparent',
    },

    addressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(2),
      gap: wp(2.5),
    },
    mapBtn: {
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      flex: 0.3,
      borderColor: isDarkMode
        ? Colors.darkTheme.secondryBtn.BtnColor
        : Colors.lightTheme.secondryBtn.BtnColor,
      borderWidth: 1,
    },
    mapBtnText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
      textAlign: 'center',
    },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      marginBottom: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
    },
    comments: {
      height: hp(40),
      textAlignVertical: 'top',
    },
    dateText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    iconRight: {
      marginLeft: wp(2),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      // marginTop: hp(2)
    },
    half: {
      width: '48%',
    },
  });



  
