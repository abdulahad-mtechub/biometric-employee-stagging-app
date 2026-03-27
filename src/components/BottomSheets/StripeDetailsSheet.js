import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import Icon from 'react-native-vector-icons/Feather';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import TxtInput from '../TextInput/Txtinput';
import { pxToPercentage } from '../../utils/responsive';

const StripeDetailsSheet = ({refRBSheet, onSubmit}) => {
  const {isDarkMode} = useSelector(state => state.theme);
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const [accountNumber, setAccountNumber] = useState('');
  const {t} = useTranslation();
  return (
    <RBSheet
      ref={refRBSheet}
      height={hp(30)}
      openDuration={300}
      closeOnPressMask={true}
      customStyles={{
        container: {
          borderTopLeftRadius: wp(6),
          borderTopRightRadius: wp(6),
          backgroundColor: theme.backgroundColor,
          padding: wp(5),
        },
      }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.primaryTextColor}]}>
          {t('Stripe Account Details')}
        </Text>
        <TouchableOpacity onPress={() => refRBSheet.current.close()}>
          <Icon
            name="x"
            size={RFPercentage(3)}
            color={theme.secondryTextColor}
          />
        </TouchableOpacity>
      </View>

      {/* Input Field */}
      <Text style={[styles.label, {color: theme.primaryTextColor}]}>
        {t('Account Number')}
      </Text>

      <TxtInput
        value={accountNumber}
        onChangeText={setAccountNumber}
        placeholder={t('Add your account number')}
        containerStyle={{
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : 'transparent',
          marginBottom: hp(3),
        }}
      />

      {/* Select Button */}
      <TouchableOpacity
        style={[styles.btn, {backgroundColor: theme.primaryBtn.BtnColor}]}
        onPress={() => onSubmit?.(accountNumber)}>
        <Text style={[styles.btnText, {color: theme.primaryBtn.TextColor}]}>
          {t('Select')}
        </Text>
      </TouchableOpacity>
    </RBSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: RFPercentage(pxToPercentage(22)),
    fontFamily: Fonts.PoppinsSemiBold,
  },
  label: {
        fontSize: RFPercentage(pxToPercentage(14)),
    fontFamily: Fonts.PoppinsMedium,
    marginBottom: hp(1),
  },
  
  btn: {
    paddingVertical: hp(1.3),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  btnText: {
    fontSize: RFPercentage(pxToPercentage(18)),
    fontFamily: Fonts.PoppinsSemiBold,
  },
});

export default StripeDetailsSheet;
