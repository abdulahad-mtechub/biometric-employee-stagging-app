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
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import SuccessBottomSheet from '../../components/BottomSheets/SuccessBottomSheet';
import {useTranslation} from 'react-i18next';

const WorkerEmploymentDetails = ({navigation, route}) => {
  const {t} = useTranslation();
  const [WorkingId, setWorkingId] = useState('');
  const [HireDate, setHireDate] = useState('');
  const successBtmSheetRef = useRef(null);
  const [Zone, setZone] = useState('');
  const [Shift, setShift] = useState('');
  const [Countries, setCountries] = useState('');
  const [Cities, setCities] = useState('');
  const [Department, setDepartment] = useState('');
  const [Designation, setDesignation] = useState('');
  const [EmploymentType, setEmploymentType] = useState('');

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
    if (index === 0) {
      setIndex(1);
    } else if (index === 1) {
      setStep(2);
      setIndex(2);
    } else if (index === 2) {
      setIndex(3);
    } else if (index === 3) {
      successBtmSheetRef.current.open();
    }
  };

  const styles = dynamicStyles(isDarkMode);

  const CreateProfileComponent = () => {
    return (
      <View style={[styles.inputsContainer]}>
        <View style={styles.paginationContainer}>
          <Svgs.checkedCircled height={hp(3.5)} />
          <View style={styles.line} />
          <Text style={[styles.paginationText, styles.activeText]}>2</Text>
        </View>
        {/* <View style={styles.contentContainer}> */}
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>
            {t('Worker Invitation & Registration')}
          </Text>
          <Text style={styles.subheading}>
            <Text style={{fontFamily: Fonts.NunitoBold}}>
              {t('Employment Details')}:
            </Text>
            {t('Tell us the employment details if worker')}.
          </Text>
        </View>

        <View style={{flex: 1, alignItems: 'center', marginTop: hp(7)}}>
          <Image
            source={Images.WorkerInvitation}
            style={{height: hp(40), width: hp(40), resizeMode: 'contain'}}
          />
        </View>
      </View>
      //   </View>
    );
  };
  const AddRegionComponent = () => {
    return (
      <View style={[styles.inputsContainer]}>
        <View style={styles.contentContainer}>
          <View style={[styles.headerContainer, {marginBottom: hp(2)}]}>
            <Text
              style={[
                styles.heading,
                {textAlign: 'left', fontSize: RFPercentage(2.5)},
              ]}>
              {t('Assign Region /Zone')}
            </Text>
          </View>
          {/* ---------------------------------------------------------------------- */}

          <CustomDropDown
            data={['Northern Ireland']}
            selectedValue={Zone}
            onValueChange={setZone}
            placeholder="Zone"
            containerStyle={[styles.dropdownContainer, {marginBottom: hp(1)}]}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
            dropdownContainerStyle={{
              position: 'absolute',
              zIndex: 10000,
              top: hp(6),
            }}
          />
          {/* </View> */}

          {/* ---------------------------------------------------------------------- */}
          <CustomDropDown
            data={['USA', 'UK']}
            selectedValue={Countries}
            onValueChange={setCountries}
            placeholder="Countries"
            containerStyle={styles.dropdownContainer}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
            dropdownContainerStyle={{
              position: 'absolute',
              zIndex: 10000,
              top: hp(6),
            }}
          />
          {/* ---------------------------------------------------------------------- */}

          <CustomDropDown
            data={['London', 'Manchester', 'Birmingham', 'Glasgow']}
            selectedValue={Cities}
            onValueChange={setCities}
            placeholder="Cities"
            containerStyle={styles.dropdownContainer}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
            dropdownContainerStyle={{
              position: 'absolute',
              zIndex: 10000,
              top: hp(6),
            }}
          />
        </View>
      </View>
    );
  };
  const EmploymentDetails = () => {
    return (
      <View style={[styles.inputsContainer]}>
        {/* <View style={styles.contentContainer}> */}
        <View style={[styles.headerContainer, {marginBottom: hp(2)}]}>
          <Text
            style={[
              styles.heading,
              {textAlign: 'left', fontSize: RFPercentage(2.5)},
            ]}>
            {t('Employment Details')}
          </Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.label}>
            {t('Employee ID')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <TxtInput
            value={WorkingId}
            containerStyle={styles.inputField}
            placeholder="Enter your ID"
            onChangeText={setWorkingId}
          />

          <CustomDropDown
            data={['Software Engineering']}
            selectedValue={Department}
            onValueChange={setDepartment}
            placeholder="Department"
            containerStyle={[styles.dropdownContainer]}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
          />
          <CustomDropDown
            data={['App Developer']}
            selectedValue={Designation}
            onValueChange={setDesignation}
            placeholder="Designation"
            containerStyle={[styles.dropdownContainer]}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
          />
          <CustomDropDown
            data={['Part Time']}
            selectedValue={EmploymentType}
            onValueChange={setEmploymentType}
            placeholder="Employment Type"
            containerStyle={[styles.dropdownContainer]}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
          />

          <Text style={styles.label}>
            {t('Hire Date')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <TxtInput
            value={HireDate}
            containerStyle={styles.inputField}
            placeholder="MM/DD/YYYY"
            onChangeText={setHireDate}
            rightSvg={<Svgs.calenderL />}
            editable={false}
          />
          <CustomDropDown
            data={['Morning', 'Evening', 'Night']}
            selectedValue={Shift}
            onValueChange={setShift}
            placeholder="Shift Schedule"
            containerStyle={[styles.dropdownContainer]}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
            astrik={true}
            dropdownContainerStyle={{
              position: 'absolute',
              zIndex: 10000,
              top: hp(6),
            }}
          />
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
            {t('Employment Details')}
          </Text>
          <Svgs.editCircled />
        </View>

        <View style={styles.DetailsContainer}>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Employee ID')}</Text>
            <Text style={[styles.value]}>AB-193-90</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Department')}</Text>
            <Text style={[styles.value]}>Construction</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Designation')}</Text>
            <Text style={[styles.value]}>Sr. Civil Engineer</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Employment Type')}</Text>
            <Text style={[styles.value]}>Permanent</Text>
          </View>

          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Hiring Date')}</Text>
            <Text style={[styles.value]}>18 Feb, 2022</Text>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Shift Schedule')}</Text>
            <Text style={[styles.value]}>Day Shift</Text>
          </View>
        </View>

        <View style={styles.WorkerDetailsHeadingContainer}>
          <Text
            style={[
              styles.heading,
              {fontSize: RFPercentage(2.5), textAlign: 'left'},
            ]}>
            {t('Assigned Zone / Region')}
          </Text>
          <Svgs.editCircled />
        </View>

        <View style={styles.DetailsContainer}>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Zone')}</Text>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.selectedZone}>Northern Europe ╳</Text>
              <Text style={styles.selectedZone}>Northern Europe ╳</Text>
            </View>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('Countries')}</Text>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.selectedZone}>Spain ╳</Text>
              <Text style={styles.selectedZone}>Italy ╳</Text>
              <Text style={styles.selectedZone}>Portugal ╳</Text>
            </View>
          </View>
          <View style={{marginVertical: hp(0.3)}}>
            <Text style={[styles.key]}>{t('City')}</Text>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.selectedZone}>All ╳</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderView = () => {
    switch (index) {
      case 1:
        return EmploymentDetails();
      case 2:
        return AddRegionComponent();
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
                onPress={() => {
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
                }}
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
                  {t('Employment')}
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
        {index === 0 ? (
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

      <SuccessBottomSheet
        refRBSheet={successBtmSheetRef}
        text="Invitation Sent Successfully!"
        BtnText={'Ok'}
        onBtnPress={() => {
          navigation.navigate(SCREENS.DASHBOARD);
          successBtmSheetRef.current?.close();
        }}
      />
    </View>
  );
};

export default WorkerEmploymentDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    contentContainer: {
      marginTop: hp(2),
      paddingHorizontal: wp(8),
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
      height: 6,
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
      width: wp(70),
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
      //   position: "absolute",
      //   bottom: hp(2.5),
      //   left: wp(0),
      //   right: wp(0),
      paddingVertical: wp(4),
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
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
      flex: 0.3,
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
      paddingHorizontal: wp(3),
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
    dropdownContainer: {
      marginBottom: hp(2.5),
    },
    selectedZone: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      backgroundColor: '#579DFF',
      paddingVertical: hp(1),
      paddingHorizontal: wp(3),
      borderRadius: wp(1),
      marginRight: wp(2),
    },
  });
