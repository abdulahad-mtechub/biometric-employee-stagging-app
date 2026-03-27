import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../../Constants/themeColors';
import { Fonts } from '../../Constants/Fonts';
import { Svgs } from '../../assets/Svgs/Svgs';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
// import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const SuccessModal = ({ visible, onClose, text }) => {
    const {isDarkMode} = useSelector(store => store.theme);
    



    const styles = StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContainer: {
          width: '80%',
          height: '37%',
          backgroundColor: isDarkMode ? Colors.darkTheme.backgroundColor: Colors.lightTheme.backgroundColor,
          borderRadius: 16,
          paddingVertical: 30,
          paddingHorizontal: 20,
          alignItems: 'center',
          position: 'relative',
        },
        closeIcon: {
          position: 'absolute',
          top: 15,
          right: 23,
          zIndex: 1,
        },
       
        message: {
          marginTop: 20,
          fontSize: RFPercentage(2.5),
          textAlign: 'center',
          fontFamily: Fonts.PoppinsSemiBold,
          color: isDarkMode?Colors.darkTheme.primaryTextColor:Colors.lightTheme.primaryTextColor,
        },
      });
      
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          {/* <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Svgs.grayCross/>
          </TouchableOpacity> */}

          <Svgs.successCheck height={hp(18)} width={wp(35)}/>
          

          {/* Message */}
          <Text style={styles.message}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;
