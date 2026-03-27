import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../utils/responsive';

const presetAmounts = [5, 10, 20, 25, 50, 75, 100, 150, 200];

const PayInstallmentBottomSheet = ({refRBSheet, onPay}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const [amount, setAmount] = useState('250.00');
  const {t} = useTranslation();

  const handlePresetPress = value => {
    setAmount(parseFloat(value).toFixed(2).toString());
  };

  return (
    <RBSheet
      ref={refRBSheet}
      height={hp(58)}
      openDuration={300}
      draggable={false}
      closeOnPressMask={true}
      customStyles={{
        container: {
          borderTopLeftRadius: wp(6),
          borderTopRightRadius: wp(6),
          backgroundColor: theme.backgroundColor,
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
        },
      }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.primaryTextColor}]}>
            {t('Pay Instalment')}
          </Text>
          <TouchableOpacity onPress={() => refRBSheet.current.close()}>
            <Icon
              name="x"
              size={RFPercentage(3)}
              color={theme.secondryTextColor}
            />
          </TouchableOpacity>
        </View>

        {/* Amount Input Box */}
        <View
          style={[styles.inputContainer, {borderColor: theme.BorderGrayColor}]}>
          <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={[
                styles.amountInput,
                {
                  color: theme.primaryTextColor,
                  fontFamily: Fonts.PoppinsMedium,
                },
              ]}
            />
            <Text style={[styles.euroSign, {color: theme.primaryTextColor}]}>
              $
            </Text>
          </View>
          <Text style={[styles.loanText, {color: theme.primaryTextColor}]}>
            {t('Loan Amount')}: $2,069.50
          </Text>
        </View>

        {/* Preset Buttons */}
        <View style={styles.buttonGrid}>
          {presetAmounts.map((val, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePresetPress(val)}
              style={[
                styles.amountButton,
                {
                  backgroundColor: isDarkMode
                    ? Colors.darkTheme.secondryColor
                    : 'transparent',
                  borderColor: theme.BorderGrayColor,
                },
              ]}>
              <Text
                style={[styles.buttonText, {color: theme.secondryTextColor}]}>
                ${val.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            {backgroundColor: theme.primaryBtn.BtnColor},
          ]}
          onPress={() => onPay?.(amount)}>
          <Text style={[styles.payText, {color: theme.primaryBtn.TextColor}]}>
            {t('Pay')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  inputContainer: {
    borderWidth: 1,
    borderRadius: wp(2),
    padding: wp(2),
    alignItems: 'center',
    marginBottom: hp(3),
  },
  amountInput: {
    fontSize: RFPercentage(pxToPercentage(48)),
    width: wp(35),
    textAlign: 'center',
  },
  euroSign: {
    fontSize: RFPercentage(pxToPercentage(22)),
    marginLeft: wp(1),
    paddingBottom: hp(0.8),
    fontFamily: Fonts.PoppinsMedium,
    position: 'absolute',
    right: wp(0),
    top: hp(1),
  },
  loanText: {
    fontSize: RFPercentage(pxToPercentage(14)),
    fontFamily: Fonts.PoppinsMedium,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  amountButton: {
    width: wp(26),
    paddingVertical: hp(1),
    borderRadius: wp(2),
    marginBottom: hp(1.5),
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: RFPercentage(pxToPercentage(14)),
    fontFamily: Fonts.PoppinsMedium,
  },
  payButton: {
    width: '100%',
    borderRadius: wp(2),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: {
    fontSize: RFPercentage(pxToPercentage(18)),
    fontFamily: Fonts.PoppinsSemiBold,
  },
});

export default PayInstallmentBottomSheet;
