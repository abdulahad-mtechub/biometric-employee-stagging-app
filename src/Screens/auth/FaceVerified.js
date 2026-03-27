import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Image, Platform, StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import {registerWorker} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';
import {pxToPercentage} from '../../utils/responsive';

const FaceVerified = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const {photoUri} = route?.params || {};
  const localizedAlert = useLocalizedAlert();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log(photoUri);

  // Check for required data on mount and warn user if missing
  React.useEffect(() => {
    const checkData = async () => {
      try {
        const personalDataRaw = await AsyncStorage.getItem('workerPersonalData');
        const signupDataRaw = await AsyncStorage.getItem('signupData');

        let personalData = {};
        let signupData = {};

        try {
          personalData = personalDataRaw ? JSON.parse(personalDataRaw) : {};
          signupData = signupDataRaw ? JSON.parse(signupDataRaw) : {};
        } catch (e) {
          // Ignore parse errors
        }

        const hasPersonalData = personalData?.first_name && personalData?.last_name;

        if (!hasPersonalData) {
          console.log('⚠️ Missing registration data - showing warning to user');
          // Don't auto-navigate, just show the warning when they try to register
        }
      } catch (e) {
        console.log('⚠️ Error checking data:', e.message);
      }
    };

    checkData();
  }, []);

  const prepareApiPayload = async () => {
    try {
      const parseData = (data, label) => {
        try {
          if (!data) return {};
          // If already an object, return it
          if (typeof data === 'object') return data;
          // Try to parse as JSON
          const parsed = JSON.parse(data);
          return parsed;
        } catch (e) {
          console.log(`⚠️ Error parsing ${label}:`, e.message);
          // If it's a string but not JSON, return empty object
          return {};
        }
      };

      // Get all stored data safely
      const personalData = parseData(
        await AsyncStorage.getItem('workerPersonalData'),
        'personalData',
      );
      const companyData = parseData(
        await AsyncStorage.getItem('workerCompanyData'),
        'companyData',
      );
      const employmentData = parseData(
        await AsyncStorage.getItem('workerEmploymentData'),
        'employmentData',
      );

      // Debug: Log what's in personalData
      console.log('🔍 Debug personalData:', JSON.stringify(personalData, null, 2));

      // Get location data from selectedLocation (saved from ProfileVerification)
      const selectedLocation = parseData(
        await AsyncStorage.getItem('selectedLocation'),
        'selectedLocation',
      );

      const signupData = parseData(
        await AsyncStorage.getItem('signupData'),
        'signupData',
      );

      // Debug: Check signupData for name fields
      console.log('🔍 Debug signupData:', JSON.stringify(signupData, null, 2));

      // Validate that we have required personal data
      if (!personalData?.first_name || !personalData?.last_name) {
        console.log('❌ Missing personal data - checking signupData as fallback');
        // Try to get name from signupData as fallback
        const firstName = personalData?.first_name || signupData?.first_name || signupData?.name?.split(' ')[0] || '';
        const lastName = personalData?.last_name || signupData?.last_name || signupData?.name?.split(' ').slice(1).join(' ') || '';

        console.log('🔍 Fallback name:', { firstName, lastName });

        if (!firstName || !lastName) {
          localizedAlert('Your profile information is missing. Please complete the registration from the beginning.', 'error');
          // Navigate back to the beginning of registration
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{name: SCREENS.CREATEWORKERPROFILE}],
            });
          }, 1500);
          return null;
        }

        // Create a new personalData object with fallback values
        personalData.first_name = firstName;
        personalData.last_name = lastName;
      }

      // Get token - check both JWT token (incomplete profile) and profile_token (new signup)
      const jwt_token = await AsyncStorage.getItem('jwt_token');
      const profile_token = await AsyncStorage.getItem('profile_token');

      console.log('🔍 Token Debug:', {
        jwt_token_exists: !!jwt_token,
        jwt_token_preview: jwt_token
          ? jwt_token.substring(0, 30) + '...'
          : 'None',
        profile_token_exists: !!profile_token,
        profile_token: profile_token,
      });

      const authToken = jwt_token || null;
      // Always use profile_token for profile completion, regardless of jwt_token
      const bodyProfileToken = profile_token || null;

      const faceImageUrlRaw = await AsyncStorage.getItem('FaceImageUrl');
      const faceImageUrl =
        typeof faceImageUrlRaw === 'string' &&
        faceImageUrlRaw.startsWith('http')
          ? faceImageUrlRaw
          : '';

      const payload = {
        first_name: personalData?.first_name || '',
        middle_name: personalData?.middle_name || '',
        last_name: personalData?.last_name || '',
        dob: personalData?.dob || '',
        phone: personalData?.phone || '',
        profile_image: personalData?.profile_image || '',
        document_url: personalData?.national_id_document_front || '',
        company_id: companyData?.company_id || null,
        department_id: companyData?.department_id || null,
        workspace_code: companyData?.workspace_code || '',
        worker_id: employmentData?.worker_id || '',
        position: employmentData?.designation || '',
        employee_type: employmentData?.employee_type || '',
        hire_date: employmentData?.hire_date || new Date().toISOString().split('T')[0],
        shift_schedule: employmentData?.shift_schedule || '',
        work_hours: employmentData?.working_hours || '',
        salary: employmentData?.salary || '',
        latitude: selectedLocation?.latitude || '',
        longitude: selectedLocation?.longitude || '',
        street_address: selectedLocation?.street_address || '',
        city: selectedLocation?.city || '',
        community: selectedLocation?.community || '',
        province: selectedLocation?.province || '',
        postal_code: selectedLocation?.postal_code || '',
        country: selectedLocation?.country || '',
        address: selectedLocation?.address || '',
        assign_region: selectedLocation?.assign_region || '',
        assign_zone: selectedLocation?.assign_zone || '',
        email: signupData?.email || '',
        password: signupData?.password || '',
        profile_token: bodyProfileToken,
        face_image_url: faceImageUrl,
        // face_data: {
        //   template: 'base64_encoded_biometric_template',
        //   confidence_score: 0.95,
        //   face_quality: 'high',
        //   detection_algorithm: 'FaceNet',
        // },
      };

      // Add profile_token to payload if we have it and no JWT token
      if (bodyProfileToken) {
        payload.profile_token = bodyProfileToken;
      }

      console.log(
        '*******************Payload:',
        JSON.stringify(payload, null, 2),
      );

      // Set loading state
      setIsLoading(true);

      // Helper function to attempt registration with retry
      const attemptRegistration = async (retryCount = 0, maxRetries = 2) => {
        try {
          const response = await registerWorker(payload, authToken);

          // Check for token-related errors that warrant a retry
          const isTokenError =
            response?.message?.includes('Invalid profile token') ||
            response?.message?.includes('worker not found') ||
            response?.message_en?.includes('Invalid profile token') ||
            response?.message_en?.includes('worker not found');

          // Retry if it's a token error and we haven't exceeded max retries
          if (isTokenError && retryCount < maxRetries) {
            console.log(
              `⚠️ Token error detected, retrying... (attempt ${retryCount + 1}/${maxRetries})`,
            );
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1500));
            return attemptRegistration(retryCount + 1, maxRetries);
          }

          return response;
        } catch (apiError) {
          console.log('❌ API Error:', apiError.message);
          // Retry on network error
          if (retryCount < maxRetries) {
            console.log(
              `⚠️ Network error, retrying... (attempt ${retryCount + 1}/${maxRetries})`,
            );
            await new Promise(resolve => setTimeout(resolve, 1500));
            return attemptRegistration(retryCount + 1, maxRetries);
          }
          throw apiError;
        }
      };

      try {
        const response = await attemptRegistration();

        // Don't show success message here since we'll navigate away
        if (response?.error === false) {
          try {
            await AsyncStorage.multiRemove([
              'profile_token',
              'jwt_token',
              'signupData',
              'workerPersonalData',
              'workerCompanyData',
              'workerEmploymentData',
              'workerLocationData',
              'selectedLocation',
              'FaceImageUrl',
              'workerProfileData',
              'profile_user_data',
              'profile_user_id',
            ]);
          } catch (cleanupError) {
            console.log(
              '⚠️ Error clearing AsyncStorage:',
              cleanupError.message,
            );
          }

          // Show success message before navigating
          localizedAlert(response, 'success');
          navigation.navigate(SCREENS.ADMINAPPROVALSCREEN);
        } else {
          // Show error message
          localizedAlert(response, 'error');
          console.log('❌ Registration failed:', response?.message);
        }
      } catch (apiError) {
        console.log('❌ API Error:', apiError.message);
        console.log('❌ API Error Stack:', apiError.stack);
        localizedAlert(
          {error: true, message: 'Registration failed. Please try again.'},
          'error',
        );
      } finally {
        setIsLoading(false);
      }

      return payload;
    } catch (error) {
      console.log('❌ Error preparing payload:', error.message);
      console.log('❌ Error Stack:', error.stack);
      setIsLoading(false);
      localizedAlert(
        {error: true, message: 'An error occurred. Please try again.'},
        'error',
      );
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={{paddingBottom: hp(2)}}>
        <Image source={{uri: photoUri}} style={styles.image} />
        <Svgs.checkedCircled style={styles.checkedCircled} />
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>{t('Face Verification Completed')}</Text>
        <Text style={styles.subheading}>
          {t(
            'Await admin approval to start managing companies and tracking earnings.',
          )}
        </Text>
      </View>
      <View style={[styles.btnContainer]}>
        <CustomButton
          text={'Logout'}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{name: SCREENS.LOGIN}],
            });
          }}
          textStyle={styles.SkipButtonText}
          containerStyle={[styles.SkipButton, {width: '35%'}]}
        />
        <CustomButton
          text={isLoading ? 'Registering...' : 'Register'}
          onPress={prepareApiPayload}
          disabled={isLoading}
          loading={isLoading}
          textStyle={styles.continueButtonText}
          containerStyle={[
            styles.continueButton,
            {width: '55%', marginLeft: wp(7), opacity: isLoading ? 0.7 : 1},
          ]}
        />
      </View>
    </View>
  );
};

export default FaceVerified;
const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: Platform.OS === 'ios' ? hp(5) : hp(7),
    },
    image: {
      width: Platform.OS === 'ios' ? hp(40) : hp(45),
      height: Platform.OS === 'ios' ? hp(40) : hp(45),
      resizeMode: 'cover',
      borderRadius: wp(100),
      borderColor: '#06D188',
      borderWidth: 4,
      alignSelf: 'center',
    },
    checkedCircled: {
      position: 'absolute',
      bottom: hp(0),
      alignSelf: 'center',
      backgroundColor: '#ffffff',
      borderRadius: wp(100),
    },
    headerContainer: {
      marginTop: hp(3),
      alignItems: 'center',
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(26)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    subheading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp(80),
      marginTop: hp(2),
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
      flexDirection: 'row',
      // backgroundColor:'red',
      alignSelf: 'flex-end',
      marginTop: hp(17),
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
      fontSize: RFPercentage(pxToPercentage(16)),
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
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.secondryBtn.TextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
  });
