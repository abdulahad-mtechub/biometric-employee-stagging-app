import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { useSelector } from 'react-redux';
import { Colors } from '../../Constants/themeColors';
import { Fonts } from '../../Constants/Fonts';
import { Svgs } from '../../assets/Svgs/Svgs';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import CustomButton from '../Buttons/customButton';
import { useTranslation } from 'react-i18next';

const SuccessBottomSheet = ({ refRBSheet, text, BtnText, onBtnPress, height }) => {
  const { isDarkMode } = useSelector(store => store.theme);
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: hp(4),
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    message: {
      marginTop: hp(5),
      fontSize: RFPercentage(2.5),
      textAlign: 'center',
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
     btn: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
      width: wp('80%'),
      alignSelf: 'center',
      marginTop: hp(2),
    },
    btnText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.9),
    },
  });

  return (
    <RBSheet
      ref={refRBSheet}
      height={height || hp(37)}
      openDuration={300}
      closeOnPressMask={true}
      draggable={true}
      customStyles={{
        container: {
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: styles.container.backgroundColor,
        },
      }}>
      <View style={styles.container}>
        <Svgs.successCheck height={hp(10)} width={wp(35)} />
        <Text style={styles.message}>{t(text)}</Text>
        {
            BtnText  &&<CustomButton
            containerStyle={styles.btn}
            text={BtnText}
            textStyle={styles.btnText}
            onPress={onBtnPress}
          />
        }
        
      </View>
    </RBSheet>
  );
};

export default SuccessBottomSheet;
