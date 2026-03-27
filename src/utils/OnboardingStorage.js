import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for tracking onboarding status
const ONBOARDING_KEY = '@has_seen_onboarding';

/**
 * Check if user has seen onboarding before
 * @returns {Promise<boolean>} - true if onboarding has been seen, false otherwise
 */
export async function hasSeenOnboarding() {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    console.log('[OnboardingStorage] Checking status:', value);
    const hasSeen = value === 'true';
    console.log('[OnboardingStorage] Has seen onboarding:', hasSeen);
    return hasSeen;
  } catch (error) {
    console.error('[OnboardingStorage] Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Mark onboarding as seen
 * @returns {Promise<void>}
 */
export async function setOnboardingSeen() {
  try {
    console.log('[OnboardingStorage] Setting onboarding as seen...');
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('[OnboardingStorage] Successfully set onboarding status');
    // Verify it was set
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    console.log('[OnboardingStorage] Verification - current value:', value);
  } catch (error) {
    console.error('[OnboardingStorage] Error setting onboarding status:', error);
  }
}

/**
 * Reset onboarding status (useful for testing or reinstalls)
 * @returns {Promise<void>}
 */
export async function resetOnboardingStatus() {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('[OnboardingStorage] Error resetting onboarding status:', error);
  }
}
