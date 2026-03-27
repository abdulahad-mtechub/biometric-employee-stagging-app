import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {FlatList, StyleSheet, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {loanData} from '../../Constants/DummyData';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import PayInstallmentBottomSheet from '../../components/BottomSheets/PayInstallmentBottomSheet';
import SelectPaymentMethodSheet from '../../components/BottomSheets/SelectPaymentMethodSheet';
import StripeDetailsSheet from '../../components/BottomSheets/StripeDetailsSheet';
import LoanCard from '../../components/Cards/LoanCard';
import TxtInput from '../../components/TextInput/Txtinput';

const SelectInstallments = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const [search, setSearch] = useState('');
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const payInstallmentRef = useRef(null);
  const paymentMethodSheetRef = useRef(null);
  const stripeSheetRef = useRef(null);

  const handleSelectInstallment = item => {
    setSelectedInstallment(item);
    console.log('Selected Installment:', item);
    payInstallmentRef.current?.open();
  };

  const filteredData = loanData.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.rowView}>
        <MaterialCommunityIcons
          onPress={() => navigation.goBack()}
          name={'chevron-left'}
          size={RFPercentage(4)}
          color={
            isDarkMode
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor
          }
        />
        <TxtInput
          placeholder={'Search'}
          svg={
            isDarkMode ? (
              <Svgs.searchD height={hp(2.5)} width={hp(2.5)} />
            ) : (
              <Svgs.SearchL height={hp(2.5)} width={hp(2.5)} />
            )
          }
          onChangeText={searchQuery => setSearch(searchQuery)}
          rightIcon={search.length > 0 && 'close-circle-outline'}
          rightIconSize={wp(6)}
          rightBtnStyle={{width: wp(8), backgroundColor: 'transparent'}}
          rightIconPress={() => setSearch('')}
          value={search}
          containerStyle={styles.inputContainer}
          style={{flex: 1, marginHorizontal: wp(4)}}
        />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{paddingHorizontal: wp(6)}}
        keyboardShouldPersistTaps="handled"
        renderItem={({item}) => (
          <LoanCard
            title={item.title}
            date={item.date}
            amount={item.amount}
            installment={item.installment}
            onPress={() => handleSelectInstallment(item)}
          />
        )}
      />
      <PayInstallmentBottomSheet
        refRBSheet={payInstallmentRef}
        onPay={() => {
          payInstallmentRef.current?.close();
          paymentMethodSheetRef.current?.open();
        }}
      />

      <SelectPaymentMethodSheet
        refRBSheet={paymentMethodSheetRef}
        onSelect={method => {
          paymentMethodSheetRef.current?.close();
          console.log('Selected:', method);
          if (method === 'stripe') stripeSheetRef.current.open();
        }}
      />

      <StripeDetailsSheet
        refRBSheet={stripeSheetRef}
        onSubmit={acc => stripeSheetRef.current.close()}
      />
    </View>
  );
};

export default SelectInstallments;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(2),
      paddingHorizontal: wp(4),
    },
    inputContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.input,
    },
  });
