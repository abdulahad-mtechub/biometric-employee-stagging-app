import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Colors} from '../../Constants/themeColors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import StackHeader from '../../components/Header/StackHeader';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import RequestDetailsCard from '../../components/Cards/RequestDetailsCard';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import {pxToPercentage} from '../../utils/responsive';

const AbsenceHistory = ({route, navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const item = route.params?.item;

  const styles = dynamicStyles(isDarkMode, theme);

  // Details specific to Absence History request
  const absenceHistoryDetails = [
    {label: 'Applied For', value: '22 June, 2025'},
    {label: 'Duration', value: '1 Day'},
    {
      label: 'Details',
      value: 'I want to rest as my previous project was so hectic.',
    },
  ];

  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={{flex: 1}}>
        <StackHeader
          title={item?.name}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
          rightIcon={<Svgs.menuDots />}
        />

        {/* Status */}
        <View style={styles.statusContainer}>
          <WorkerStatus
            name={t('Status')}
            status={t(item?.status)}
            nameTextStyle={styles.statusText}
          />
          <View style={styles.rowSb}>
            <Text style={styles.statusText}>{t('Requested')}</Text>
            <Text
              style={[
                styles.statusText,
                {
                  fontFamily: Fonts.PoppinsRegular,
                  fontSize: RFPercentage(pxToPercentage(14)),
                },
              ]}>
              12 May, 2025
            </Text>
          </View>
        </View>

        {/* Absence Details */}
        <RequestDetailsCard
          heading={'Absence Details'}
          details={absenceHistoryDetails}
          showFrom={false}
        />

        {/* Supporting Proof */}
        <View style={styles.cardContainer}>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Supporting Proof')}</Text>
            <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity>
              <Svgs.pdf />
              <Text style={styles.pdfText}>SRS.pdf</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Details */}
        <View style={styles.cardContainer}>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Action Details')}</Text>
            <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />
          </View>
          <Row label={'Action on'} value={'13 May, 2025'} />
          <Row
            label={'Admin Comment'}
            value={
              "Your request has been approved and will add your manual punch within 2 days. If your punch doesn't update, comment in request"
            }
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.btnContainer}>
        <CustomButton
          text={'Withdraw Request'}
          onPress={() => {}}
          textStyle={styles.continueButtonText}
          containerStyle={[
            styles.continueButton,
            {backgroundColor: Colors.error},
          ]}
        />
      </View>
    </View>
  );
};

export default AbsenceHistory;

const dynamicStyles = (isDarkMode, theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      marginTop: wp(2),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: theme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(16)),
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(0.5),
    },
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      marginHorizontal: wp(4),
      marginBottom: hp(2),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    valueContainer: {
      flex: 1.2,
      alignItems: 'flex-end',
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
    },
    title: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlignVertical: 'center',
    },
    pdfContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.backgroundColor}70`
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(30),
      marginTop: hp(2),
    },
    pdfText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.NunitoBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(0.5),
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      paddingBottom: hp(2),
      paddingTop: wp(4),
      paddingHorizontal: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    continueButtonText: {
      fontSize: RFPercentage(1.9),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });
