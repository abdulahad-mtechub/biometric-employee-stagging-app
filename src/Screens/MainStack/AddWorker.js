import React, {useRef, useState} from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs';
import {SCREENS} from '../../Constants/Screens';
import CustomButton from '../../components/Buttons/customButton';
import TxtInput from '../../components/TextInput/Txtinput';
import useBackHandler from '../../utils/useBackHandler';
import {Images} from '../../assets/Images/Images';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CInputWithCountryCode from '../../components/TextInput/CInputWithCountryCode';
import {useTranslation} from 'react-i18next';

const AddWorker = ({navigation, route}) => {
  const {t} = useTranslation();
  const [WorkerFullName, setWorkerFullName] = useState('');
  const [WorkerEmail, setWorkerEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [DOB, setDOB] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const {isDarkMode} = useSelector(store => store.theme);
  const [step, setStep] = useState(1); // Start from step 1
  const totalSteps = 2;

  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  const indexx = route.params?.indexx;
  const [index, setIndex] = useState(indexx || 0); // 0 = forget password screen, 1 = verify code screen
  const BackHandler = () => {
    if (index === 1) {
      setIndex(0);
    } else if (index === 2) {
      setIndex(1);
      setStep(1);
    } else if (index === 3) {
      setIndex(2);
    } else {
      navigation.goBack();
    }
  };

  useBackHandler(BackHandler);

  // ---------- Validation ----------

  const handleContinue = () => {
    // if (index === 0 && validateForm()) {
    //   setIndex(1);
    // } else if (index === 1 && validateAddressForm()) {
    //   setIndex(2);
    // } else if (index === 2 && validateRepresentativeForm()) {
    //   navigation.navigate(SCREENS.SUBSCRIPTION, {isLogin: true});
    // }
    if (index === 0) {
      setIndex(1);
    } else if (index === 1) {
      setStep(2);
      setIndex(2);
    } else if (index === 2) {
      setIndex(3);
    } else if (index === 3) {
      navigation.navigate(SCREENS.WORKEREMPLOYMENTDETAILS);
    }
  };

  const styles = dynamicStyles(isDarkMode);

  const CreateProfileComponent = () => {
    return (
      <View style={[styles.inputsContainer]}>
        <View style={styles.paginationContainer}>
          <Text style={[styles.paginationText, styles.activeText]}>1</Text>
          <View style={styles.line} />
          <Text style={[styles.paginationText]}>2</Text>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>
              {t('Worker Invitation & Registration')}
            </Text>
            <Text style={styles.subheading}>
              <Text style={{fontFamily: Fonts.NunitoBold}}>
                {t('Worker Registration:')}
              </Text>
              {t('Tell us the personal details of worker')}
            </Text>
          </View>

          <View style={{flex: 1, alignItems: 'center', marginTop: hp(7)}}>
            <Image
              source={Images.CreateCompanyProfile}
              style={{height: hp(40), width: hp(40), resizeMode: 'contain'}}
            />
          </View>
        </View>
      </View>
    );
  };
  const AddAddressComponent = () => {
    return (
      <View style={[styles.inputsContainer, {marginBottom: hp(5)}]}>
        {/* <View style={styles.contentContainer}> */}
        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.heading,
              {textAlign: 'left', fontSize: RFPercentage(2.5)},
            ]}>
            {t('Worker Address & Location')}
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
              style={{flex: 1}}
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
      </View>
    );
  };
  const PersonalDetails = () => {
    return (
      <View style={[styles.inputsContainer]}>
        {/* <View style={styles.contentContainer}> */}
        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.heading,
              {textAlign: 'left', fontSize: RFPercentage(2.5)},
            ]}>
            {t('Personal Information')}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            marginTop: hp(2),
            width: '85%',
          }}>
          <Text style={styles.label}>
            {t('Full Name')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <TxtInput
            value={WorkerFullName}
            containerStyle={styles.inputField}
            placeholder="Enter the worker full name"
            onChangeText={setWorkerFullName}
          />
          <Text style={styles.label}>
            {t('Date of Birth (DOB)')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <TxtInput
            value={DOB}
            containerStyle={styles.inputField}
            placeholder={t('Select your birth date')}
            onChangeText={setDOB}
            rightSvg={<Svgs.calenderL />}
            editable={false}
          />

          <Text style={styles.label}>
            {t('Email')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <TxtInput
            value={WorkerEmail}
            containerStyle={styles.inputField}
            placeholder="Admin@company.com"
            onChangeText={setWorkerEmail}
          />
          <Text style={styles.label}>
            {t('Phone Number')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>

          <CInputWithCountryCode
            phoneNo={phoneNumber}
            setPhoneNo={setPhoneNumber}
            setCountryCode={setCountryCode}
            countryCode={countryCode}
            placeholder="(555) 123-4567"
            width="100%"
            placeholderTextColor={
              isDarkMode
                ? Colors.darkTheme.QuaternaryText
                : Colors.lightTheme.QuaternaryText
            }
          />

          <View style={{marginTop: hp(2)}}>
            <Text style={styles.label}>
              {t('Photo')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor,
                  fontFamily: Fonts.PoppinsRegular,
                },
              ]}>
              {t('Upload image in PNG/JPG Format')}
            </Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={{
                  padding: wp(4),
                  backgroundColor: isDarkMode
                    ? Colors.darkTheme.backgroundColor
                    : '#5E5F60',
                  borderRadius: wp(10),
                }}>
                <Svgs.whitePlus />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* </View> */}
      </View>
    );
  };

  const WorkerDetails = () => {
    return (
      <View style={[styles.inputsContainer]}>
        <View style={styles.WorkerDetailsHeadingContainer}>
          <Text
            style={[
              styles.heading,
              {fontSize: RFPercentage(2.5), textAlign: 'left'},
            ]}>
            {t('Personal Details')}
          </Text>
          <Svgs.editCircled />
        </View>

        <View style={styles.DetailsContainer}>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Full Name')}</Text>
            <Text style={[styles.value]}>Jane Rotanson</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Date of Birth (DOB)')}</Text>
            <Text style={[styles.value]}>23 May, 2000</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Email')}</Text>
            <Text style={[styles.value]}>Johndoe@gmail.com</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Phone No')}.</Text>
            <Text style={[styles.value]}>+34 612 345 678</Text>
          </View>
          <View
            style={{
              marginVertical: hp(0.3),
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <View>
              <Text style={[styles.key]}>{t('Photo')}</Text>
              <Text style={[styles.value]}>799021djakjdg6.png</Text>
            </View>
            <Svgs.eye />
          </View>
        </View>

        <View style={styles.WorkerDetailsHeadingContainer}>
          <Text
            style={[
              styles.heading,
              {fontSize: RFPercentage(2.5), textAlign: 'left'},
            ]}>
            {t('Worker Address & Location')}
          </Text>
          <Svgs.editCircled />
        </View>

        <View style={styles.DetailsContainer}>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Country')}</Text>
            <Text style={[styles.value]}>Spain</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Community/Proviance')}</Text>
            <Text style={[styles.value]}>Comunidad de Madrid</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('City')}</Text>
            <Text style={[styles.value]}>Madrid</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Postal Code')}</Text>
            <Text style={[styles.value]}>28013</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Street Address')}</Text>
            <Text style={[styles.value]}>Calle Mayor 45, 2ºA</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderView = () => {
    switch (index) {
      case 1:
        return PersonalDetails();
      case 2:
        return AddAddressComponent();
      case 3:
        return WorkerDetails();

      default:
        return CreateProfileComponent();
    }
  };

  return (
    <View style={[styles.mainContainer]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{flexGrow: 1}]}>
        <KeyboardAvoidingView
          style={{flex: 1, paddingTop: hp(2)}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}>
          {(index === 1 || index === 2 || index === 3) && (
            <View style={styles.backArrowContainer}>
              <MaterialCommunityIcons
                name={'close'}
                size={RFPercentage(4)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.iconColor
                }
                onPress={BackHandler}
              />
              {index === 1 || index === 2 ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBackground}>
                    <View
                      style={[styles.progressFill, {width: `${progress}%`}]}
                    />
                  </View>
                  <Text style={styles.stepText}>{`${step}/${totalSteps}`}</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.heading,
                    {
                      fontSize: RFPercentage(2.5),
                      fontFamily: Fonts.PoppinsMedium,
                    },
                  ]}>
                  {t('Personal Details')}
                </Text>
              )}
            </View>
          )}

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {renderView()}
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ScrollView>
      <View style={[styles.btnContainer, index === 0 && {borderTopWidth: 0}]}>
        {index === 0 || index === 1 ? (
          <CustomButton
            text={'Next'}
            onPress={handleContinue}
            textStyle={styles.continueButtonText}
            containerStyle={[styles.continueButton]}
          />
        ) : (
          <View style={{flexDirection: 'row'}}>
            <CustomButton
              text={'Back'}
              onPress={BackHandler}
              textStyle={styles.SkipButtonText}
              containerStyle={[styles.SkipButton, {width: '35%'}]}
            />
            <CustomButton
              text={index === 3 ? 'Confirm & Next' : 'Next'}
              onPress={handleContinue}
              textStyle={styles.continueButtonText}
              containerStyle={[
                styles.continueButton,
                {width: '50%', marginLeft: wp(7)},
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default AddWorker;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    contentContainer: {
      flex: 1,
      alignItems: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      marginBottom: hp(3),
    },
    line: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      height: hp(0.2),
      alignSelf: 'center',
      width: wp(30),
      marginHorizontal: wp(1),
    },
    paginationText: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.BorderGrayColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(100),
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.2),
    },
    activeText: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderWidth: 1,
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: wp(5),
      marginBottom: hp(2),
    },
    progressContainer: {
      flex: 1,
      marginLeft: 10,
      alignItems: 'center',
      flexDirection: 'row',
    },
    progressBackground: {
      height: hp(1),
      backgroundColor: '#ddd',
      borderRadius: 4,
      width: '70%',
      overflow: 'hidden',
      marginHorizontal: hp(2),
    },
    progressFill: {
      height: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },

    stepText: {
      fontSize: 12,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    headerContainer: {
      alignItems: 'center',
    },
    heading: {
      fontSize: RFPercentage(3),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
      width: wp(80),
    },
    subheading: {
      fontSize: RFPercentage(2.1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp(80),
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
    inputsContainer: {
      paddingBottom: hp(2),
      flex: 1,
      alignItems: 'center',
    },

    label: {
      fontSize: RFPercentage(1.8),
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
    },
    uploadContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(30),
    },

    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      paddingVertical: wp(4),
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    continueButtonText: {
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    SkipButton: {
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#f1f2f4',
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    SkipButtonText: {
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.secondryBtn.TextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
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
      flex: 0.4,
      borderColor: isDarkMode
        ? Colors.darkTheme.secondryBtn.BtnColor
        : Colors.lightTheme.secondryBtn.BtnColor,
      borderWidth: 1,
    },
    mapBtnText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
      textAlign: 'center',
    },
    WorkerDetailsHeadingContainer: {
      marginVertical: hp(2),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    DetailsContainer: {
      backgroundColor: `${
        isDarkMode
          ? Colors.darkTheme.primaryColor
          : Colors.lightTheme.primaryColor
      }20`,
      paddingHorizontal: wp(2),
      borderColor: isDarkMode ? '#D1E9FB' : '#D1E9FB',
      borderWidth: 1,
      borderRadius: wp(2),
      paddingVertical: hp(1),
    },
    key: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.QuaternaryText,
      fontFamily: Fonts.PoppinsRegular,
      width: wp(80),
      //   marginBottom: hp(0.5),
    },
    value: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#363333',
    },
  });
