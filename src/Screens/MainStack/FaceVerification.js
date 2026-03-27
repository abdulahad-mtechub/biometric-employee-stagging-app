import React from 'react';
import {StyleSheet} from 'react-native';
import FaceScaning from '../auth/FaceScaning';

const FaceVerification = ({route, navigation}) => {
  const handleVerificationSuccess = async photoUri => {
    try {
      // Upload the photo and get URL
      const uploadResponse = await uploadImage({
        path: photoUri,
        token: token,
      });

      if (uploadResponse.error === false) {
        const imageUrl = uploadResponse.data?.url;

        // Call the success callback from route params
        if (route.params?.onVerificationSuccess) {
          route.params.onVerificationSuccess(imageUrl);
        }
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showAlert('Face verification failed', 'error');
    }
  };

  return (
    <FaceScaning onSuccess={handleVerificationSuccess} isAttendance={true} />
  );
};

export default FaceVerification;

const styles = StyleSheet.create({
  // ...styles
});
