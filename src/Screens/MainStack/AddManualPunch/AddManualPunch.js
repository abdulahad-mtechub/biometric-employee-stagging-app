import {StyleSheet, Text, View} from 'react-native';
import React, {useRef, useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../../Constants/Fonts';
import {Colors} from '../../../Constants/themeColors';
import {useSelector} from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Step2 from './Steps/Step2';
import CustomButton from '../../../components/Buttons/customButton';
import Step1 from './Steps/Step1';
import NavigateAbleBtmSheet from '../../../components/BottomSheets/NavigateAbleBtmSheet';
import {manualPunches} from '../../../Constants/DummyData';
import { useTranslation } from 'react-i18next';
import { pxToPercentage } from '../../../utils/responsive';

const AddManualPunch = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [step, setStep] = useState(1);

  const BackHandler = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };
  const handleContinue = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };
  return (
    <View style={styles.container}>
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

        <Text style={[styles.heading]}>{t("Manual Punch Request")}({step}/2)</Text>
      </View>
      {step === 1 ? <Step1 /> : <Step2 />}

      <View style={styles.btnContainer}>
        {step === 1 ? (
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
              text={'Save'}
              onPress={handleContinue}
              textStyle={styles.continueButtonText}
              containerStyle={[styles.continueButton, { width: "50%", marginLeft: wp(7)  }]}
            />
          </View>
        )}
      </View>

     
    </View>
  );
};

export default AddManualPunch;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(2),
      paddingTop: hp(2),
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: wp(2),
      marginBottom: hp(2),
    },
    heading: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      width: wp(80),
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsMedium,
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,

      paddingVertical: wp(4),
      paddingHorizontal: wp(4),
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
  });
