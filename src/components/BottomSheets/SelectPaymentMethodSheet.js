import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../Constants/themeColors';
import { Fonts } from '../../Constants/Fonts';
import { Svgs } from '../../assets/Svgs/Svgs';
import { useTranslation } from 'react-i18next';
import { pxToPercentage } from '../../utils/responsive';

const paymentOptions = [
  {
    id: 'paypal',
    name: 'Paypal',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    
  },
];

const SelectPaymentMethodSheet = ({ refRBSheet, onSelect }) => {
  const { isDarkMode } = useSelector(state => state.theme);
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const [selected, setSelected] = useState('paypal');
  const {t} = useTranslation();

  return (
    <RBSheet
      ref={refRBSheet}
      height={hp(33)}
      openDuration={300}
      closeOnPressMask={true}
      customStyles={{
        container: {
          borderTopLeftRadius: wp(6),
          borderTopRightRadius: wp(6),
          backgroundColor: theme.backgroundColor,
          padding: wp(5),
        },
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primaryTextColor }]}>
          {t("Select Payment Method")}
        </Text>
        <TouchableOpacity onPress={() => refRBSheet.current.close()}>
          <Icon name="x" size={RFPercentage(3)} color={theme.secondryTextColor} />
        </TouchableOpacity>
      </View>

      {/* Payment Options */}
      <View style={styles.optionsRow}>
        {paymentOptions.map(item => {
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelected(item.id)}
              style={[
                styles.optionCard,
                {
                  backgroundColor:  'transparent',
                  borderColor: isSelected ? Colors.lightTheme.primaryColor : theme.BorderGrayColor,
                },
              ]}
            >
              {item.id === 'paypal' ? <Svgs.paypal height={hp(5)} /> : <Svgs.stripe  height={hp(5)}/>}
              <Text style={[styles.optionText, { color: theme.primaryTextColor }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Select Button */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme.primaryBtn.BtnColor }]}
        onPress={() => onSelect?.(selected)}
      >
        <Text style={[styles.btnText, { color: theme.primaryBtn.TextColor }]}>Select</Text>
      </TouchableOpacity>
    </RBSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  title: {
    fontSize: RFPercentage(pxToPercentage(22)),
    fontFamily: Fonts.PoppinsSemiBold,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  optionCard: {
    width: wp(42),
    paddingVertical: hp(1),
    borderWidth: 1.5,
    borderRadius: wp(2.5),
    alignItems: 'center',
  },
  paymentIcon: {
    width: wp(10),
    height: wp(10),
    marginBottom: hp(1),
  },
  optionText: {
    fontSize: RFPercentage(pxToPercentage(14)),
    fontFamily: Fonts.PoppinsMedium,
    marginTop: hp(1),
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

export default SelectPaymentMethodSheet;
