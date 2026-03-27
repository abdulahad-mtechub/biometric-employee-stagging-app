import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { SCREENS } from '../Constants/Screens';
import Login from '../Screens/auth/Login';
import Onboarding from '../Screens/auth/Onboarding';
import Welcome from '../Screens/auth/Welcome';
import SelectRole from '../Screens/auth/SelectRole';
import CreateWorkerProfile from '../Screens/auth/CreateWorkerProfile';
import ProfileVerification from '../Screens/auth/ProfileVerification';
import FaceVerified from '../Screens/auth/FaceVerified';
import Signup from '../Screens/auth/SignUp';
import ForgetPassword from '../Screens/auth/ForgetPassword';
import FaceScaning from '../Screens/auth/FaceScaning';
import OtpVerification from '../Screens/auth/OtpVerification';
import FaceScanLogin from '../Screens/auth/FaceScanLogin';
import AdminApprovalScreen from '../Screens/auth/AdminApprovalScreen';
import OtpVerificationScreen from '../Screens/auth/OtpVerificationScreen';
import { hasSeenOnboarding } from '../utils/OnboardingStorage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../Constants/themeColors';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    console.log('[AuthStack] Checking onboarding status...');
    const seen = await hasSeenOnboarding();
    console.log('[AuthStack] Onboarding seen:', seen);
    console.log('[AuthStack] Will show onboarding:', !seen);
    setShowOnboarding(!seen);
    setHasCheckedOnboarding(true);
  };

  // Show loading while checking onboarding status
  if (!hasCheckedOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.lightTheme.primaryColor}
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={SCREENS.ONBOARDING}>
      <Stack.Screen name={SCREENS.ONBOARDING} component={Onboarding} />
      <Stack.Screen name={SCREENS.LOGIN} component={Login} />
      <Stack.Screen name={SCREENS.WELCOME} component={Welcome} />
      <Stack.Screen name={SCREENS.SELECTROLE} component={SelectRole} />
      <Stack.Screen
        name={SCREENS.CREATEWORKERPROFILE}
        component={CreateWorkerProfile}
      />
      <Stack.Screen
        name={SCREENS.PROFILEVERIFICATION}
        component={ProfileVerification}
      />
      <Stack.Screen name={SCREENS.FACEIDVERIFIED} component={FaceVerified} />
      <Stack.Screen name={SCREENS.SIGNUP} component={Signup} />
      <Stack.Screen name={SCREENS.FORGET} component={ForgetPassword} />
      <Stack.Screen name={SCREENS.FACESCANING} component={FaceScaning} />
      <Stack.Screen
        name={SCREENS.OTPVERIFICATION}
        component={OtpVerification}
      />
      <Stack.Screen name={SCREENS.FACESCANLOGIN} component={FaceScanLogin} />
      <Stack.Screen
        name={SCREENS.OTPVERIFICATIONSCREEN}
        component={OtpVerificationScreen}
      />
      <Stack.Screen
        name={SCREENS.ADMINAPPROVALSCREEN}
        component={AdminApprovalScreen}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightTheme.backgroundColor,
  },
});

export default AuthStack;
