import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Images} from '../../assets/Images/Images';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';
import {setOnboardingSeen} from '../../utils/OnboardingStorage';

const Onboarding = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t, i18n} = useTranslation();
  const {language} = useSelector(store => store?.auth);
  const normalizedLang = (language || 'English').toLowerCase();

  // Check if language is Spanish
  const isSpanish =
    normalizedLang === 'spanish' ||
    normalizedLang === 'español' ||
    normalizedLang === 'es';

  const pages = React.useMemo(
    () => [
      {
        image: isSpanish ? Images.OnboardingEs1 : Images.Onboarding1,
        title: t('Clock In with Face & \nGPS'),
        subtitle: t(
          'Start work, breaks, and tasks using secure facial recognition and location tracking.',
        ),
      },
      {
        image: isSpanish ? Images.OnboardingEs2 : Images.Onboarding2,
        title: t('See Your Tasks for \nToday'),
        subtitle: t(
          'View assigned tasks and complete them with biometric confirmation.',
        ),
      },
      {
        image: isSpanish ? Images.OnboardingEs3 : Images.Onboarding3,
        title: t('Messages, Requests & \nDocuments'),
        subtitle: t(
          'Chat with your admin, submit requests, and upload required documents easily.',
        ),
      },
    ],
    [t, isSpanish, i18n.language],
  );
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef(null);

  const handleContinue = async () => {
    console.log('[Onboarding] handleContinue called, current page:', currentPage, 'total pages:', pages.length);
    if (currentPage < pages.length - 1) {
      pagerRef.current.setPage(currentPage + 1);
    } else {
      // Mark onboarding as seen when user completes it
      console.log('[Onboarding] Completing onboarding, calling setOnboardingSeen...');
      await setOnboardingSeen();
      console.log('[Onboarding] Navigating to SIGNUP');
      navigation.navigate(SCREENS.SIGNUP);
    }
  };

  const lastPage = currentPage === pages.length - 1;
  const secondPage = currentPage === 1;
  const onPageSelected = e => {
    setCurrentPage(e.nativeEvent.position);
  };

  const styles = dynamicStyles(isDarkMode);

  const renderPaginationDots = () => {
    return (
      <View style={[styles.paginationContainer]}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                // backgroundColor: currentPage === index ? Colors.lightTheme.primaryColor : Colors.lightTheme.BorderGrayColor  ,
                backgroundColor:
                  currentPage === index
                    ? Colors.lightTheme.primaryColor
                    : '#5E5F60',
                width: currentPage === index ? wp(10) : wp(2),
                height: hp(0.8),
                borderRadius: wp(4),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const screenHeight = Dimensions.get('screen').height;

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.lightTheme.backgroundColor}
        barStyle={'dark-content'}
      />
      <View style={{alignItems: 'center'}}>
        <Svgs.Logo />
      </View>

      <PagerView
        style={[{height: '100%'}]}
        initialPage={0}
        onPageSelected={onPageSelected}
        ref={pagerRef}>
        {pages.map((page, index) => (
          <View key={index} style={styles.imgContainer}>
            <View style={styles.Background}>
              <Image
                source={page.image}
                style={{width: wp(90), height: hp(85), resizeMode: 'contain'}}
              />
            </View>
            <View style={styles.curvedImageL}>
              <View style={{height: hp(27)}}>
                <Text
                  style={styles.text}
                  numberOfLines={2}
                  adjustsFontSizeToFit>
                  {page.title}
                </Text>
                {/* (index === 1 || index === 2 || index === 0) && { marginHorizontal: wp(2), fontSize: RFPercentage(2) } */}
                {page.subtitle && (
                  <Text
                    style={[styles.subHeading]}
                    numberOfLines={2}
                    adjustsFontSizeToFit>
                    {page.subtitle}
                  </Text>
                )}
              </View>
              <View>{renderPaginationDots()}</View>
            </View>
          </View>
        ))}
      </PagerView>
      <View style={styles.btnContainer}>
        {!lastPage && (
          <TouchableOpacity
            style={[styles.btn, {backgroundColor: 'transparent'}]}
            onPress={async () => {
              console.log('[Onboarding] Skipping onboarding');
              await setOnboardingSeen();
              navigation.navigate(SCREENS.LOGIN);
            }}>
            <Text
              style={[
                styles.btnText,
                {color: Colors.lightTheme.secondryBtn.TextColor},
              ]}>
              {t('Skip')}
            </Text>
          </TouchableOpacity>
        )}
        <CustomButton
          containerStyle={[
            styles.btn,
            {width: wp(50)},
            lastPage && {width: wp(90)},
          ]}
          text={t('Next')}
          textStyle={styles.btnText}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
};

export default Onboarding;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },

    imgContainer: {
      flex: 1,
    },
    Background: {
      alignItems: 'center',
      marginTop: hp(1),
    },
    curvedImageL: {
      position: 'absolute',
      bottom: 0,
      width: wp(100),
      height: hp(50),
      alignItems: 'center',
      alignSelf: 'center',
      borderStartStartRadius: wp(10),
      borderTopEndRadius: wp(10),
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#F1F1FF',
      paddingHorizontal: wp(1),
      overflow: 'hidden',
    },
    text: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontSize: RFPercentage(pxToPercentage(29.01)),
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
      marginTop: hp(5),
      width: wp(95),
      alignSelf: 'center',
    },
    subHeading: {
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#000000',
      fontSize: RFPercentage(pxToPercentage(16.23)),
      textAlign: 'center',
      marginTop: hp(1.8),
      fontFamily: Fonts.NunitoRegular,
      paddingHorizontal: wp(4),
      // backgroundColor:'red'
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    dot: {
      borderRadius: wp(2.5),
      marginHorizontal: wp(0.5),
    },
    btn: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.3),
      borderRadius: wp(4),
      justifyContent: 'center',
      alignItems: 'center',
      width: wp(30),
      borderColor: isDarkMode
        ? Colors.darkTheme.secondryBtn.BtnColor
        : Colors.lightTheme.secondryBtn.BtnColor,
      borderWidth: 1,
    },
    btnText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
    },
    btnContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: hp(2),
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      position: 'absolute',
      width: '100%',
      bottom: 10,
    },
  });
