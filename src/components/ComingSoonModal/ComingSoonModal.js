import React, {useRef, useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {pxToPercentage} from '../../utils/responsive';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {t} from 'i18next';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';

const ComingSoonModal = ({isVisible, onClose}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const lottieRef = useRef();
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setStartAnimation(false);
      const timer = setTimeout(() => {
        setStartAnimation(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const styles = StyleSheet.create({
    modal: {
      justifyContent: 'center',
      margin: 0,
    },
    container: {
      alignItems: 'center',
    },
    minicontainer: {
      borderRadius: 20,
      width: '98%',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      paddingVertical: hp(5),
      paddingHorizontal: wp(5),
    },
    lottieConnectingView: {
      width: wp(60),
      height: hp(40),
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(22.84)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
      marginBottom: hp(2),
    },
  });
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
      backdropColor="#000">
      <View style={styles.container}>
        <View style={styles.minicontainer}>
          <LottieView
            ref={lottieRef}
            style={styles.lottieConnectingView}
            source={require('../../assets/Animations/comingSoonRocket.json')}
            autoPlay={startAnimation}
            loop={true}
            speed={1}
          />
          <Text style={styles.heading}>
            {t('Coming Soon! Stay tuned for updates')}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default ComingSoonModal;
